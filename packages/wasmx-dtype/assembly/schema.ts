
import { DTypeField } from "./types";
import { JSONEncoder } from "assemblyscript-json/assembly";

export function generateJsonSchema(fields: DTypeField[]): string {
  let encoder = new JSONEncoder();
  encoder.pushObject(null);

  encoder.setString("type", "object");

  encoder.pushObject("properties");
  for (let i = 0; i < fields.length; i++) {
    const field = fields[i];
    encoder.pushObject(field.name);
    encoder.setString("type", sqlTypeToJson(field.value_type));
    encoder.popObject();
  }
  encoder.popObject(); // end "properties"

  // Add "required" array if needed
  const requiredFields = fields.filter(f => f.sql_options.includes("NOT NULL"));
  if (requiredFields.length > 0) {
    encoder.pushArray("required");
    for (let i = 0; i < requiredFields.length; i++) {
      encoder.setString(null, requiredFields[i].name);
    }
    encoder.popArray();
  }

  encoder.popObject(); // end root

  return encoder.toString();
}

export function sqlTypeToJson(sqlType: string): string {
    const typ = sqlType.toLowerCase()
    if (typ == "blob") return "string"
    if (typ == "text") return "string"
    if (typ.includes("varchar")) return "string"
    if (typ.includes("char")) return "string"
    if (typ == "boolean") return "boolean"
    if (typ == "integer") return "integer"
    if (typ.includes("decimal")) return "integer"
    return "any"
}
