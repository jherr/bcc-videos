import { For, createMemo } from "solid-js";
import type { Component } from "solid-js";

import {
  videos,
  search,
  setSearch,
  filterVideos,
  createFieldToggles,
} from "./createVideos";

import "./index.css";

const Filters: Component<{
  field: string;
  selected: () => Record<string, boolean>;
  toggle: (key: string) => void;
  clearAll: () => void;
}> = ({ field, toggle, clearAll, selected }) => {
  const keys = createMemo(() => {
    const series: Record<string, boolean> = {};
    videos().forEach((video) =>
      video[field].forEach((v) => (series[v] = false))
    );
    return Object.keys(series).sort();
  });

  return (
    <>
      <div class="mui--divider-bottom" style={{ "margin-top": "1rem" }}></div>
      <div class="mui--text-subhead">
        {`${field.charAt(0).toUpperCase()}${field.slice(1)}`}
        <button
          onclick={clearAll}
          class="mui-btn mui-btn--small mui-btn--primary mui-btn--flat"
        >
          Clear All
        </button>
      </div>
      <div
        style={{
          "max-height": "300px",
          "overflow-y": "scroll",
        }}
      >
        <For each={keys()}>
          {(k: string) => (
            <div class="mui-checkbox">
              <label>
                <input
                  type="checkbox"
                  value=""
                  checked={selected()[k]}
                  onclick={() => toggle(k)}
                />
                {k}
              </label>
            </div>
          )}
        </For>
      </div>
    </>
  );
};

const App: Component = () => {
  const filters = {
    series: createFieldToggles(),
    languages: createFieldToggles(),
    technologies: createFieldToggles(),
  };

  const filteredVideos = filterVideos({
    languages: filters.languages.selected,
    technologies: filters.technologies.selected,
    series: filters.series.selected,
  });

  return (
    <div class="container">
      <div class="main-layout">
        <div>
          <div class="mui-textfield">
            <input
              type="text"
              value={search()}
              oninput={(e) => setSearch(e.currentTarget.value)}
            />
            <label>Search</label>
          </div>
          <For each={Object.keys(filters)}>
            {(k) => (
              <Filters
                field={k}
                selected={filters[k].selected}
                toggle={filters[k].toggle}
                clearAll={filters[k].clearAll}
              />
            )}
          </For>
        </div>
        <div class="videos-layout">
          <For each={filteredVideos()}>
            {(video) => (
              <>
                <div style={{ "margin-top": "1rem" }}>
                  <a
                    href={`https://www.youtube.com/watch?v=${video.id}`}
                    target="_blank"
                  >
                    <div
                      className="mui--text-subhead"
                      style={{ "font-weight": "bold" }}
                    >
                      {video.title}
                    </div>
                    <div class="mui--text-caption date">
                      Posted {video.timeAgo}
                    </div>
                    <div innerHTML={video.descriptionHTML} />
                  </a>
                </div>
                <div style={{ "margin-top": "1rem" }}>
                  <a
                    href={`https://www.youtube.com/watch?v=${video.id}`}
                    target="_blank"
                  >
                    <img
                      src={video.thumbnails.high.url}
                      style={{ width: "100%" }}
                    />
                  </a>
                </div>
              </>
            )}
          </For>
        </div>
      </div>
    </div>
  );
};

export default App;
