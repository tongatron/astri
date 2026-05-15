import * as A from 'astronomy-engine';
import type { Location } from '@/state/store';

export function toObserver(loc: Location): A.Observer {
  return new A.Observer(loc.lat, loc.lon, 0);
}
