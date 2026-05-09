import { defineCatalog } from "@json-render/core";
import {
  schema,
  standardComponentDefinitions,
} from "@json-render/react-email/server";

export const emailCatalog = defineCatalog(schema, {
  components: standardComponentDefinitions,
  actions: {},
});
