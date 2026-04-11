/**
 * PageHeader — universal admin page header.
 *
 * Usage:
 *   <PageHeader
 *     title="Accommodation"
 *     subtitle="Manage properties & rooms"
 *     count={42}
 *     action={<Link href="/admin/accommodation/new" className="btn-primary">New Property</Link>}
 *   />
 *
 * Props:
 *   title    (string)     — required. Page heading.
 *   subtitle (string)     — optional. Secondary descriptor line.
 *   count    (number|string) — optional. Badge shown next to title (e.g. total count).
 *   badge    (string)     — optional. Coloured badge text (e.g. a status label).
 *   action   (ReactNode)  — optional. Right-side action slot (buttons / links).
 *   children (ReactNode)  — optional. Extra content below title row (e.g. tab filters).
 */
export default function PageHeader({ title, subtitle, count, badge, action, children }) {
  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        {/* Left — title + meta */}
        <div className="min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-[18px] font-semibold text-white/90 leading-tight tracking-tight">
              {title}
            </h1>

            {count !== undefined && count !== null && (
              <span className="inline-flex items-center text-[10px] font-medium text-white/35
                bg-white/[0.06] border border-white/[0.08] rounded-full px-2.5 py-1 leading-none">
                {count}
              </span>
            )}

            {badge && (
              <span className="inline-flex items-center text-[10px] font-medium text-[#c05aae]
                bg-[#7A2267]/12 border border-[#7A2267]/25 rounded-full px-2.5 py-1 leading-none">
                {badge}
              </span>
            )}
          </div>

          {subtitle && (
            <p className="text-[11.5px] text-white/30 mt-1 leading-snug">
              {subtitle}
            </p>
          )}
        </div>

        {/* Right — action slot */}
        {action && (
          <div className="shrink-0 flex items-center gap-2">
            {action}
          </div>
        )}
      </div>

      {/* Optional extra row (filters, tabs, etc.) */}
      {children}
    </div>
  );
}
