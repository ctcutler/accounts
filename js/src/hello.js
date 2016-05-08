import { bang } from './bang';

export function greet(name) {
  return 'Hello, ' + name + bang();
}
