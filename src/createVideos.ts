import lunr from "lunr";
import { createResource, createSignal, createMemo } from "solid-js";
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

const fixURLs = (text: string): string =>
  text.replace(/(https:[^\)\s]*)/g, '<a href="$1" target="_blank">$1</a>');

export const [videos] = createResource<Video[]>(
  () =>
    fetch("/bcc-videos/videos.json")
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

export const [search, setSearch] = createSignal("");

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

export function createFieldToggles(): {
  selected: () => Record<string, boolean>;
  toggle: (key: string) => void;
  clearAll: () => void;
} {
  const [selected, setKeys] = createSignal<Record<string, boolean>>({});
  const toggle = (value: string) => {
    setKeys((selected) => ({
      ...selected,
      [value]: !selected[value],
    }));
  };
  const clearAll = () =>
    setKeys((selected) =>
      Object.keys(selected).reduce(
        (a, k) => ({
          ...a,
          [k]: false,
        }),
        {}
      )
    );
  return {
    selected,
    toggle,
    clearAll,
  };
}

export function filterVideos(
  filters: Record<string, () => Record<string, boolean>>
): () => Video[] {
  return createMemo(() => {
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
    const filterFuncs = Object.keys(filters).map((k) =>
      createFilter(filters[k](), k)
    );
    return searchIndex()
      .search(search())
      .map((found) => videoMap[found.ref])
      .filter((video) => filterFuncs.every((f) => f(video)))
      .sort((a, b) => -(a.posted.getTime() - b.posted.getTime()))
      .slice(0, 20);
  });
}
