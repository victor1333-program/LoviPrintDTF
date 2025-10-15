"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Modal } from "@/components/ui/Modal"
import { UserForm } from "@/components/admin/UserForm"
import { Search, Mail, Phone, User, Plus, Edit, Trash2, Eye } from "lucide-react"
import toast from "react-hot-toast"
import { LoyaltyBadge } from "@/components/LoyaltyBadge"
import { LoyaltyTier } from "@prisma/client"
import { pointsToEuros } from "@/lib/loyalty"

interface UserData {
  id: string
  name: string | null
  email: string
  phone: string | null
  role: string
  company: string | null
  taxId: string | null
  isProfessional: boolean
  professionalDiscount: any
  shippingAddress: any
  billingAddress: any
  createdAt: string
  loyaltyPoints: number
  totalSpent: any
  loyaltyTier: LoyaltyTier
  _count: {
    orders: number
  }
}

export default function UsuariosPage() {
  const [users, setUsers] = useState<UserData[]>([])
  const [filteredUsers, setFilteredUsers] = useState<UserData[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState("")
  const [tierFilter, setTierFilter] = useState("")
  const [showModal, setShowModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null)
  const [editingUser, setEditingUser] = useState<UserData | null>(null)

  useEffect(() => {
    loadUsers()
  }, [])

  useEffect(() => {
    filterUsers()
  }, [search, roleFilter, tierFilter, users])

  const loadUsers = async () => {
    try {
      setLoading(true)
      const res = await fetch("/api/admin/users")
      if (!res.ok) throw new Error("Error al cargar usuarios")
      const data = await res.json()
      setUsers(data)
      setFilteredUsers(data)
    } catch (error) {
      console.error("Error loading users:", error)
      toast.error("Error al cargar usuarios")
    } finally {
      setLoading(false)
    }
  }

  const filterUsers = () => {
    let filtered = users

    if (search) {
      const searchLower = search.toLowerCase()
      filtered = filtered.filter(
        (user) =>
          user.name?.toLowerCase().includes(searchLower) ||
          user.email.toLowerCase().includes(searchLower) ||
          user.phone?.toLowerCase().includes(searchLower)
      )
    }

    if (roleFilter) {
      filtered = filtered.filter((user) => user.role === roleFilter)
    }

    if (tierFilter) {
      filtered = filtered.filter((user) => user.loyaltyTier === tierFilter)
    }

    setFilteredUsers(filtered)
  }

  const handleDelete = async (userId: string, userName: string) => {
    if (
      !confirm(
        `¿Estás seguro de que quieres eliminar al usuario "${userName || "Sin nombre"}"? Esta acción no se puede deshacer.`
      )
    ) {
      return
    }

    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Error al eliminar usuario")
      }

      toast.success("Usuario eliminado correctamente")
      loadUsers()
    } catch (error: any) {
      console.error("Error:", error)
      toast.error(error.message || "Error al eliminar usuario")
    }
  }

  const handleView = (user: UserData) => {
    setSelectedUser(user)
    setShowViewModal(true)
  }

  const handleEdit = (user: UserData) => {
    setEditingUser(user)
    setShowModal(true)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Usuarios</h1>
          <p className="text-gray-600 mt-2">Lista de usuarios registrados en la plataforma</p>
        </div>
        <Button
          onClick={() => {
            setEditingUser(null)
            setShowModal(true)
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Usuario
        </Button>
      </div>

      {/* Filtros */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex gap-4 items-center">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nombre, email o teléfono..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Todos los roles</option>
              <option value="CUSTOMER">Clientes</option>
              <option value="ADMIN">Administradores</option>
            </select>
            <select
              value={tierFilter}
              onChange={(e) => setTierFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Todos los tiers</option>
              <option value="BRONZE">🥉 Bronce</option>
              <option value="SILVER">🥈 Plata</option>
              <option value="GOLD">🥇 Oro</option>
              <option value="PLATINUM">💎 Platino</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de Usuarios */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Usuarios ({filteredUsers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              {search || roleFilter ? "No se encontraron usuarios" : "No hay usuarios registrados"}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b bg-gray-50">
                  <tr className="text-left text-sm text-gray-600">
                    <th className="p-3">Nombre</th>
                    <th className="p-3">Email</th>
                    <th className="p-3">Teléfono</th>
                    <th className="p-3">Rol</th>
                    <th className="p-3">Tier</th>
                    <th className="p-3">Puntos</th>
                    <th className="p-3">Pedidos</th>
                    <th className="p-3">Fecha Registro</th>
                    <th className="p-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="border-b hover:bg-gray-50">
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                            <User className="h-5 w-5 text-primary-600" />
                          </div>
                          <div>
                            <p className="font-semibold">{user.name || "Sin nombre"}</p>
                            {user.isProfessional && (
                              <span className="text-xs text-primary-600 font-medium">
                                Profesional
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Mail className="h-4 w-4" />
                          {user.email}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          {user.phone ? (
                            <>
                              <Phone className="h-4 w-4" />
                              {user.phone}
                            </>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </div>
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            user.role === "ADMIN"
                              ? "bg-purple-100 text-purple-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {user.role === "ADMIN" ? "Administrador" : "Cliente"}
                        </span>
                      </td>
                      <td className="p-3">
                        <LoyaltyBadge tier={user.loyaltyTier} size="sm" />
                      </td>
                      <td className="p-3">
                        <div>
                          <p className="font-semibold text-primary-600">{user.loyaltyPoints}</p>
                          <p className="text-xs text-gray-500">
                            ≈ {pointsToEuros(user.loyaltyPoints).toFixed(2)}€
                          </p>
                        </div>
                      </td>
                      <td className="p-3">
                        <span className="font-semibold">{user._count.orders}</span>
                      </td>
                      <td className="p-3 text-sm text-gray-600">
                        {new Date(user.createdAt).toLocaleDateString("es-ES")}
                      </td>
                      <td className="p-3">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleView(user)}
                            title="Ver detalles"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(user)}
                            title="Editar usuario"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(user.id, user.name || user.email)}
                            title="Eliminar usuario"
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal Crear/Editar Usuario */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false)
          setEditingUser(null)
        }}
        title={editingUser ? "Editar Usuario" : "Nuevo Usuario"}
        maxWidth="4xl"
      >
        <UserForm
          user={editingUser}
          onSuccess={() => {
            setShowModal(false)
            setEditingUser(null)
            loadUsers()
          }}
          onCancel={() => {
            setShowModal(false)
            setEditingUser(null)
          }}
        />
      </Modal>

      {/* Modal Ver Detalles */}
      {selectedUser && (
        <Modal
          isOpen={showViewModal}
          onClose={() => {
            setShowViewModal(false)
            setSelectedUser(null)
          }}
          title="Detalles del Usuario"
          maxWidth="3xl"
        >
          <div className="space-y-6">
            {/* Información Básica */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Información Básica</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Nombre:</p>
                  <p className="font-medium">{selectedUser.name || "-"}</p>
                </div>
                <div>
                  <p className="text-gray-600">Email:</p>
                  <p className="font-medium">{selectedUser.email}</p>
                </div>
                <div>
                  <p className="text-gray-600">Teléfono:</p>
                  <p className="font-medium">{selectedUser.phone || "-"}</p>
                </div>
                <div>
                  <p className="text-gray-600">Rol:</p>
                  <p className="font-medium">
                    {selectedUser.role === "ADMIN" ? "Administrador" : "Cliente"}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Pedidos realizados:</p>
                  <p className="font-medium">{selectedUser._count.orders}</p>
                </div>
                <div>
                  <p className="text-gray-600">Fecha de registro:</p>
                  <p className="font-medium">
                    {new Date(selectedUser.createdAt).toLocaleDateString("es-ES")}
                  </p>
                </div>
              </div>
            </div>

            {/* Información de Fidelidad */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Programa de Fidelidad</h3>
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg p-4 border-2 border-amber-200">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-semibold text-gray-700">Tier actual:</span>
                  <LoyaltyBadge tier={selectedUser.loyaltyTier} size="md" />
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Puntos disponibles:</p>
                    <p className="font-bold text-primary-600 text-lg">{selectedUser.loyaltyPoints}</p>
                    <p className="text-xs text-gray-500">
                      ≈ {pointsToEuros(selectedUser.loyaltyPoints).toFixed(2)}€ en descuentos
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Total gastado:</p>
                    <p className="font-bold text-gray-900 text-lg">
                      {Number(selectedUser.totalSpent).toFixed(2)}€
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Pedidos completados:</p>
                    <p className="font-bold text-gray-900 text-lg">{selectedUser._count.orders}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Información Profesional */}
            {selectedUser.isProfessional && (
              <div>
                <h3 className="text-lg font-semibold mb-3">Información Profesional</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Empresa:</p>
                    <p className="font-medium">{selectedUser.company || "-"}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">CIF/NIF:</p>
                    <p className="font-medium">{selectedUser.taxId || "-"}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Descuento profesional:</p>
                    <p className="font-medium">
                      {selectedUser.professionalDiscount
                        ? `${Number(selectedUser.professionalDiscount).toFixed(2)}%`
                        : "0%"}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Dirección de Envío */}
            {selectedUser.shippingAddress && (
              <div>
                <h3 className="text-lg font-semibold mb-3">Dirección de Envío</h3>
                <div className="text-sm">
                  <p>{selectedUser.shippingAddress.street}</p>
                  <p>
                    {selectedUser.shippingAddress.postalCode} {selectedUser.shippingAddress.city}
                  </p>
                  <p>
                    {selectedUser.shippingAddress.state}, {selectedUser.shippingAddress.country}
                  </p>
                </div>
              </div>
            )}

            {/* Dirección de Facturación */}
            {selectedUser.billingAddress && (
              <div>
                <h3 className="text-lg font-semibold mb-3">Dirección de Facturación</h3>
                <div className="text-sm">
                  <p>{selectedUser.billingAddress.street}</p>
                  <p>
                    {selectedUser.billingAddress.postalCode} {selectedUser.billingAddress.city}
                  </p>
                  <p>
                    {selectedUser.billingAddress.state}, {selectedUser.billingAddress.country}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => {
                setShowViewModal(false)
                handleEdit(selectedUser)
              }}
            >
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setShowViewModal(false)
                setSelectedUser(null)
              }}
            >
              Cerrar
            </Button>
          </div>
        </Modal>
      )}
    </div>
  )
}
