import { Avatar, AvatarImage, AvatarFallback } from "../../ui/avatar/avatar.jsx"
import "../../ui/avatar/avatar.css"

/* Inline so the demo loads a real image without an external request. */
const PORTRAIT =
  "data:image/svg+xml," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40">
       <rect width="40" height="40" fill="#c7d2fe"/>
       <circle cx="20" cy="15" r="7" fill="#4338ca"/>
       <path d="M6 40c0-8 6-13 14-13s14 5 14 13z" fill="#4338ca"/>
     </svg>`
  )

export default function AvatarPage() {
  return (
    <>
      <h2>Avatar</h2>

      <section className="pg-section">
        <h3>With Image</h3>
        <div className="pg-row">
          <Avatar>
            <AvatarImage src={PORTRAIT} alt="Casey Nolan" />
            <AvatarFallback>CN</AvatarFallback>
          </Avatar>
        </div>
      </section>

      <section className="pg-section">
        <h3>Fallback</h3>
        <div className="pg-row">
          <Avatar>
            <AvatarImage src="/broken-image.png" alt="Broken" />
            <AvatarFallback>AB</AvatarFallback>
          </Avatar>
          <Avatar>
            <AvatarFallback>JD</AvatarFallback>
          </Avatar>
        </div>
      </section>

      <section className="pg-section">
        <h3>Multiple</h3>
        <div className="pg-row">
          <Avatar>
            <AvatarFallback>PW</AvatarFallback>
          </Avatar>
          <Avatar>
            <AvatarFallback>MK</AvatarFallback>
          </Avatar>
          <Avatar>
            <AvatarFallback>RS</AvatarFallback>
          </Avatar>
        </div>
      </section>
    </>
  )
}
