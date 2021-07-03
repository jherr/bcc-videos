import lunr from "lunr";
import {
  createResource,
  createSignal,
  createMemo,
  createEffect,
} from "solid-js";
import * as timeAgo from "timeago.js";

export interface ThumbnailSize {
  url: string;
  width: number;
  height: number;
}

export interface Video {
  id: string;
  publishedAt: string;
  posted: Date;
  timeAgo: string;
  title: string;
  thumbnails: {
    default: ThumbnailSize;
    medium: ThumbnailSize;
    high: ThumbnailSize;
    standard: ThumbnailSize;
    maxres: ThumbnailSize;
  };
  categoryId: string;
  tags: string[];
  description: string;
  descriptionHTML: string;
  series: string[];
  technologies: string[];
  languages: string[];
}

function createFieldToggles(
  videos: () => Video[],
  field: string
): {
  keys: () => Record<string, boolean>;
  toggle: (key: string) => void;
  clearAll: () => void;
} {
  const [keys, setKeys] = createSignal<Record<string, boolean>>({});
  createEffect(() => {
    const series: Record<string, boolean> = {};
    videos().forEach((video) =>
      video[field].forEach((v) => (series[v] = false))
    );
    setKeys(series);
  });
  const toggle = (value: string) => {
    setKeys((keys) => ({
      ...keys,
      [value]: !keys[value],
    }));
  };
  const clearAll = () =>
    setKeys((keys) =>
      Object.keys(keys).reduce(
        (a, k) => ({
          ...a,
          [k]: false,
        }),
        {}
      )
    );
  return {
    keys,
    toggle,
    clearAll,
  };
}

const fixURLs = (text: string): string =>
  text.replace(/(https:[^\)\s]*)/g, '<a href="$1" target="_blank">$1</a>');

export function createVideos(): {
  videos: () => Video[];

  search: () => string;
  setSearch: (str: string) => void;

  series: () => Record<string, boolean>;
  toggleSeries: (lang: string) => void;
  clearAllSeries: () => void;

  languages: () => Record<string, boolean>;
  toggleLanguage: (lang: string) => void;
  clearAllLanguages: () => void;

  technologies: () => Record<string, boolean>;
  toggleTechnology: (lang: string) => void;
  clearAllTechnologies: () => void;
} {
  const [videos] = createResource<Video[]>(
    () =>
      fetch("/videos.json")
        .then((resp) => resp.json())
        .then((videos: Video[]) =>
          videos.map((video) => ({
            ...video,
            posted: new Date(video.publishedAt),
            timeAgo: timeAgo.format(new Date(video.publishedAt)),
            descriptionHTML: fixURLs(video.description),
          }))
        ),
    { initialValue: [] }
  );
  const [search, setSearch] = createSignal("");

  const searchIndex = createMemo(() => {
    return lunr(function () {
      this.field("title");
      this.field("description");
      videos()
        .filter((t) => t)
        .forEach((video) => {
          this.add(video);
        });
    });
  });

  const {
    keys: languages,
    toggle: toggleLanguage,
    clearAll: clearAllLanguages,
  } = createFieldToggles(videos, "languages");

  const {
    keys: technologies,
    toggle: toggleTechnology,
    clearAll: clearAllTechnologies,
  } = createFieldToggles(videos, "technologies");

  const {
    keys: series,
    toggle: toggleSeries,
    clearAll: clearAllSeries,
  } = createFieldToggles(videos, "series");

  const foundVideos = createMemo(() => {
    const videoMap = videos().reduce(
      (a, video) => ({
        ...a,
        [video.id]: video,
      }),
      {}
    );

    const createFilter = (
      lookup: Record<string, boolean>,
      field: string
    ): ((video) => Boolean) => {
      const keys = Object.keys(lookup).filter((l) => lookup[l]);
      return keys.length
        ? (video) => video[field].some((l) => keys.includes(l))
        : () => true;
    };
    const langFilter = createFilter(languages(), "languages");
    const techsFilter = createFilter(technologies(), "technologies");
    const seriesFilter = createFilter(series(), "series");
    return searchIndex()
      .search(search())
      .map((found) => videoMap[found.ref])
      .filter(langFilter)
      .filter(techsFilter)
      .filter(seriesFilter)
      .sort((a, b) => -(a.posted.getTime() - b.posted.getTime()))
      .slice(0, 20);
  });

  return {
    videos: foundVideos,
    search,
    setSearch,
    languages,
    toggleLanguage,
    clearAllLanguages,
    technologies,
    toggleTechnology,
    clearAllTechnologies,
    series,
    toggleSeries,
    clearAllSeries,
  };
}
