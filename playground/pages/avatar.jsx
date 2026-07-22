import { Avatar, AvatarImage, AvatarFallback } from "../../ui/avatar/avatar.jsx"
import "../../ui/avatar/avatar.css"

export default function AvatarPage() {
  return (
    <>
      <h2>Avatar</h2>

      <section className="pg-section">
        <h3>With Image</h3>
        <div className="pg-row">
          <Avatar>
            <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
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
