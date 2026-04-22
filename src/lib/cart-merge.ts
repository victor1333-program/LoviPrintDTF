import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'

/**
 * Merges a guest cart (identified by sessionId) into the given user's cart.
 * - If the user has no cart yet, reassigns the guest cart to the user.
 * - If both exist, moves items from the guest cart into the user cart
 *   (items with files become new rows; items without files merge by productId).
 * - Always deletes the guest cart row at the end so the sessionId is free.
 */
export async function mergeGuestCartIntoUser(sessionId: string, userId: string): Promise<void> {
  const guestCart = await prisma.cart.findUnique({
    where: { sessionId },
    include: { items: true },
  })

  if (!guestCart) return

  if (guestCart.userId === userId) return

  const userCart = await prisma.cart.findUnique({
    where: { userId },
    include: { items: true },
  })

  if (!userCart) {
    await prisma.cart.update({
      where: { id: guestCart.id },
      data: { userId, sessionId: null },
    })
    logger.info(`Claimed guest cart ${guestCart.id} for user ${userId}`)
    return
  }

  await prisma.$transaction(async (tx) => {
    for (const item of guestCart.items) {
      const hasFile = !!item.fileUrl || !!item.fileName

      if (!hasFile) {
        const existing = await tx.cartItem.findFirst({
          where: {
            cartId: userCart.id,
            productId: item.productId,
            fileName: null,
          },
        })

        if (existing) {
          await tx.cartItem.update({
            where: { id: existing.id },
            data: { quantity: Number(existing.quantity) + Number(item.quantity) },
          })
          continue
        }
      }

      await tx.cartItem.update({
        where: { id: item.id },
        data: { cartId: userCart.id },
      })
    }

    await tx.cart.delete({ where: { id: guestCart.id } })
  })

  logger.info(`Merged guest cart ${guestCart.id} into user cart ${userCart.id}`)
}
