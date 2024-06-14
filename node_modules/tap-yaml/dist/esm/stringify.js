import yaml from 'yaml';
import { customTags } from './types/index.js';
export const stringify = (obj) => yaml.stringify(obj, { customTags, prettyErrors: true });
//# sourceMappingURL=stringify.js.map