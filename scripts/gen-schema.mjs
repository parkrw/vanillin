#!/usr/bin/env node
import { writeFileSync } from "node:fs"
import { resolve, dirname } from "node:path"
import { fileURLToPath } from "node:url"
import {
  FRAMEWORKS,
  PATH_KEYS,
  PATH_DEFAULTS,
  BRAND_KEYS,
  THEME_KEYS,
  MOTION_KEYS,
  FONT_KEYS,
  DENSITY_PRESETS,
  DENSITY_RANGE,
  MOTION_SCALE_RANGE,
  COMPONENT_SECTION_KEYS,
} from "./config-schema.mjs"

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, "..")

const cssPropertyMap = {
  type: "object",
  additionalProperties: { type: "string" },
}

const componentDef = {
  type: "object",
  additionalProperties: false,
  properties: {},
}
for (const key of COMPONENT_SECTION_KEYS) {
  if (key === "tokens") {
    componentDef.properties[key] = { ...cssPropertyMap }
  } else {
    componentDef.properties[key] = {
      type: "object",
      additionalProperties: { ...cssPropertyMap },
    }
  }
}

const pathProps = {}
for (const key of PATH_KEYS) {
  pathProps[key] = { type: "string", default: PATH_DEFAULTS[key] }
}

const brandKeyProps = {}
for (const key of BRAND_KEYS) {
  brandKeyProps[key] = { type: "string" }
}

const motionProps = {}
for (const key of MOTION_KEYS) {
  if (key === "scale") {
    motionProps[key] = {
      type: "number",
      minimum: MOTION_SCALE_RANGE[0],
      maximum: MOTION_SCALE_RANGE[1],
    }
  } else {
    motionProps[key] = { type: "string" }
  }
}

const fontProps = {}
for (const key of FONT_KEYS) {
  fontProps[key] = { type: "string" }
}

const themeProps = {}
for (const key of THEME_KEYS) {
  switch (key) {
    case "brand":
      themeProps.brand = {
        oneOf: [
          { type: "string", description: "oklch colour (shorthand for { primary })" },
          {
            type: "object",
            additionalProperties: false,
            properties: brandKeyProps,
          },
        ],
      }
      break
    case "radius":
      themeProps.radius = { type: "string" }
      break
    case "density":
      themeProps.density = {
        oneOf: [
          { type: "string", enum: Object.keys(DENSITY_PRESETS) },
          { type: "number", minimum: DENSITY_RANGE[0], maximum: DENSITY_RANGE[1] },
        ],
      }
      break
    case "motion":
      themeProps.motion = {
        type: "object",
        additionalProperties: false,
        properties: motionProps,
      }
      break
    case "font":
      themeProps.font = {
        type: "object",
        additionalProperties: false,
        properties: fontProps,
      }
      break
    case "light":
    case "dark":
      themeProps[key] = {
        type: "object",
        additionalProperties: { type: "string" },
      }
      break
  }
}

const schema = {
  $schema: "http://json-schema.org/draft-07/schema#",
  title: "Vanillin Config",
  type: "object",
  additionalProperties: false,
  properties: {
    $schema: { type: "string" },
    framework: { type: "string", enum: [...FRAMEWORKS] },
    rsc: { type: "boolean" },
    paths: {
      type: "object",
      additionalProperties: false,
      properties: pathProps,
    },
    theme: {
      type: "object",
      additionalProperties: false,
      properties: themeProps,
    },
    components: {
      type: "object",
      additionalProperties: componentDef,
    },
  },
}

const out = resolve(ROOT, "van.schema.json")
writeFileSync(out, JSON.stringify(schema, null, 2) + "\n")
console.log("wrote", out)
