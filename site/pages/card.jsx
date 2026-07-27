import { Card, CardHeader, CardTitle, CardDescription, CardAction, CardContent, CardFooter } from "../../ui/card/card.jsx"
import { Button } from "../../ui/button/button.jsx"
import "../../ui/card/card.css"
import "../../ui/button/button.css"

export default function CardPage() {
  return (
    <>
      <h2>Card</h2>

      <section className="pg-section">
        <h3>Default</h3>
        <div className="pg-row">
          <Card style={{ width: "22rem" }}>
            <CardHeader>
              <CardTitle>Card Title</CardTitle>
              <CardDescription>Card description goes here.</CardDescription>
            </CardHeader>
            <CardContent>
              <p style={{ margin: 0 }}>Card content area.</p>
            </CardContent>
            <CardFooter>
              <Button>Save</Button>
              <Button variant="outline">Cancel</Button>
            </CardFooter>
          </Card>
        </div>
      </section>

      <section className="pg-section">
        <h3>With Action</h3>
        <div className="pg-row">
          <Card style={{ width: "22rem" }}>
            <CardHeader>
              <CardTitle>Notifications</CardTitle>
              <CardDescription>Manage your notification preferences.</CardDescription>
              <CardAction>
                <Button variant="outline" size="sm">Settings</Button>
              </CardAction>
            </CardHeader>
            <CardContent>
              <p style={{ margin: 0 }}>You have 3 unread messages.</p>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="pg-section">
        <h3>Header Only</h3>
        <div className="pg-row">
          <Card style={{ width: "22rem" }}>
            <CardHeader>
              <CardTitle>Simple Card</CardTitle>
              <CardDescription>A card with header only.</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      <section className="pg-section">
        <h3>Density</h3>
        <p>
          Card padding and section gaps resolve through the{" "}
          <code>--space-*</code> density ramp. Adjusting{" "}
          <code>--density-scale</code> on <code>:root</code> tightens or
          loosens all card spacing uniformly.
        </p>
      </section>
    </>
  )
}
