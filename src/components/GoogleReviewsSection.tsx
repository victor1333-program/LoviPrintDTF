import { Star } from "lucide-react"
import { googleReviews, GOOGLE_REVIEWS_META } from "@/data/google-reviews"

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`${rating} de 5 estrellas`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${
            i < rating ? "fill-yellow-400 text-yellow-400" : "fill-gray-200 text-gray-200"
          }`}
        />
      ))}
    </div>
  )
}

function GoogleLogo({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.56c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.76c-.98.66-2.24 1.06-3.72 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.11A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.44.34-2.11V7.05H2.18A11 11 0 0 0 1 12c0 1.78.43 3.46 1.18 4.95l3.66-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.05l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"
      />
    </svg>
  )
}

function ReviewCard({ review }: { review: (typeof googleReviews)[number] }) {
  return (
    <article className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow h-full flex flex-col">
      <header className="flex items-center gap-3 mb-3">
        <div
          className={`${review.color} w-11 h-11 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0`}
          aria-hidden="true"
        >
          {review.initials}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-gray-900 truncate">{review.name}</p>
          <p className="text-xs text-gray-500">{review.date}</p>
        </div>
        <GoogleLogo className="h-5 w-5 flex-shrink-0" />
      </header>
      <StarRating rating={review.rating} />
      <p className="mt-3 text-sm text-gray-700 leading-relaxed flex-1">{review.text}</p>
    </article>
  )
}

export function GoogleReviewsSection() {
  const { ratingAverage, totalReviews, googleMapsUrl } = GOOGLE_REVIEWS_META

  return (
    <section className="py-12 sm:py-16 md:py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10 sm:mb-12">
          <div className="inline-flex items-center gap-2 bg-white rounded-full px-4 py-2 shadow-sm border border-gray-200 mb-4">
            <GoogleLogo className="h-4 w-4" />
            <span className="text-sm font-semibold text-gray-700">Reseñas verificadas en Google</span>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Lo que dicen <span className="text-primary-600">nuestros clientes</span>
          </h2>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="text-3xl font-bold text-gray-900">{ratingAverage.toFixed(1)}</span>
              <StarRating rating={Math.round(ratingAverage)} />
            </div>
            <span className="text-gray-600">
              · Basado en <span className="font-semibold">{totalReviews}</span> reseñas
            </span>
          </div>
        </div>

        {/* Desktop: grid 3 columnas */}
        <div className="hidden md:grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {googleReviews.slice(0, 6).map((review) => (
            <ReviewCard key={review.name} review={review} />
          ))}
        </div>

        {/* Móvil: scroll horizontal con snap */}
        <div className="md:hidden -mx-4 px-4 overflow-x-auto snap-x snap-mandatory flex gap-4 pb-4">
          {googleReviews.map((review) => (
            <div
              key={review.name}
              className="snap-start flex-shrink-0 w-[85%] max-w-sm"
            >
              <ReviewCard review={review} />
            </div>
          ))}
        </div>

        <div className="mt-10 text-center">
          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-semibold underline underline-offset-4"
          >
            Ver todas las reseñas en Google →
          </a>
        </div>
      </div>
    </section>
  )
}
