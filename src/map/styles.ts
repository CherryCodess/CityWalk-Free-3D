export type MapStyleId = 'dark' | 'light' | 'liberty';

export type MapStyleOption = {
  id: MapStyleId;
  name: string;
  url: string;
};

const customStyle = import.meta.env.VITE_STYLE_URL as string | undefined;

export const MAP_STYLES: MapStyleOption[] = [
  {
    id: 'liberty',
    name: 'OpenFreeMap Liberty',
    url: customStyle || 'https://tiles.openfreemap.org/styles/liberty'
  },
  {
    id: 'dark',
    name: 'Custom Dark Style',
    url: customStyle || 'https://tiles.openfreemap.org/styles/liberty'
  },
  {
    id: 'light',
    name: 'OpenFreeMap Bright',
    url: 'https://tiles.openfreemap.org/styles/bright'
  }
];

export const DEFAULT_STYLE = MAP_STYLES[0];
