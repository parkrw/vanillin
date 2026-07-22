import {
  Item,
  ItemMedia,
  ItemContent,
  ItemTitle,
  ItemDescription,
  ItemActions,
  ItemGroup,
  ItemSeparator,
  ItemHeader,
  ItemFooter,
} from "../../ui/item/item.jsx"
import "../../ui/item/item.css"
import { Button } from "../../ui/button/button.jsx"
import "../../ui/button/button.css"

function FileIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
      <path d="M14 2v4a2 2 0 0 0 2 2h4" />
    </svg>
  )
}

function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8" />
      <path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    </svg>
  )
}

function SettingsIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="3" />
      <path d="M12 1v4m0 14v4M4.2 4.2l2.8 2.8m10 10 2.8 2.8M1 12h4m14 0h4M4.2 19.8l2.8-2.8m10-10 2.8-2.8" />
    </svg>
  )
}

export default function ItemPage() {
  return (
    <>
      <h2>Item</h2>

      <section className="pg-section">
        <h3>Default</h3>
        <div style={{ maxWidth: "28rem" }}>
          <Item>
            <ItemMedia variant="icon">
              <FileIcon />
            </ItemMedia>
            <ItemContent>
              <ItemTitle>Project Notes</ItemTitle>
              <ItemDescription>Last edited 2 hours ago</ItemDescription>
            </ItemContent>
            <ItemActions>
              <Button variant="ghost" size="sm">Open</Button>
            </ItemActions>
          </Item>
        </div>
      </section>

      <section className="pg-section">
        <h3>Variants</h3>
        <div style={{ maxWidth: "28rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <Item>
            <ItemMedia variant="icon"><FileIcon /></ItemMedia>
            <ItemContent>
              <ItemTitle>Default</ItemTitle>
              <ItemDescription>No border, transparent background</ItemDescription>
            </ItemContent>
          </Item>
          <Item variant="outline">
            <ItemMedia variant="icon"><FileIcon /></ItemMedia>
            <ItemContent>
              <ItemTitle>Outline</ItemTitle>
              <ItemDescription>Bordered container</ItemDescription>
            </ItemContent>
          </Item>
          <Item variant="muted">
            <ItemMedia variant="icon"><FileIcon /></ItemMedia>
            <ItemContent>
              <ItemTitle>Muted</ItemTitle>
              <ItemDescription>Muted background</ItemDescription>
            </ItemContent>
          </Item>
        </div>
      </section>

      <section className="pg-section">
        <h3>Sizes</h3>
        <div style={{ maxWidth: "28rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <Item variant="outline">
            <ItemMedia variant="icon"><FileIcon /></ItemMedia>
            <ItemContent>
              <ItemTitle>Default size</ItemTitle>
            </ItemContent>
          </Item>
          <Item variant="outline" size="sm">
            <ItemMedia variant="icon"><FileIcon /></ItemMedia>
            <ItemContent>
              <ItemTitle>Small size</ItemTitle>
            </ItemContent>
          </Item>
          <Item variant="outline" size="xs">
            <ItemMedia variant="icon"><FileIcon /></ItemMedia>
            <ItemContent>
              <ItemTitle>Extra small size</ItemTitle>
            </ItemContent>
          </Item>
        </div>
      </section>

      <section className="pg-section">
        <h3>Grouped</h3>
        <div style={{ maxWidth: "28rem" }}>
          <ItemGroup>
            <ItemHeader>Navigation</ItemHeader>
            <Item as="a" href="#item">
              <ItemMedia variant="icon"><HomeIcon /></ItemMedia>
              <ItemContent>
                <ItemTitle>Dashboard</ItemTitle>
                <ItemDescription>Overview and stats</ItemDescription>
              </ItemContent>
            </Item>
            <ItemSeparator />
            <Item as="a" href="#item">
              <ItemMedia variant="icon"><SettingsIcon /></ItemMedia>
              <ItemContent>
                <ItemTitle>Settings</ItemTitle>
                <ItemDescription>Manage preferences</ItemDescription>
              </ItemContent>
            </Item>
            <ItemFooter>2 items</ItemFooter>
          </ItemGroup>
        </div>
      </section>
    </>
  )
}
