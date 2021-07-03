import { For } from "solid-js";
import type { Component } from "solid-js";

import { createVideos } from "./createVideos";

import "./index.css";

const Filters: Component<{
  title: string;
  keys: () => Record<string, boolean>;
  toggle: (key: string) => void;
  clearAll: () => void;
}> = ({ title, keys, toggle, clearAll }) => (
  <>
    <div class="mui--divider-bottom" style={{ "margin-top": "1rem" }}></div>
    <div class="mui--text-subhead">
      {title}
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
      <For each={Object.keys(keys()).sort()}>
        {(k: string) => (
          <div class="mui-checkbox">
            <label>
              <input
                type="checkbox"
                value=""
                checked={keys()[k]}
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

const App: Component = () => {
  const {
    videos,
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
  } = createVideos();

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

          <Filters
            title="Series"
            keys={series}
            toggle={toggleSeries}
            clearAll={clearAllSeries}
          />

          <Filters
            title="Technologies"
            keys={technologies}
            toggle={toggleTechnology}
            clearAll={clearAllTechnologies}
          />

          <Filters
            title="Languages"
            keys={languages}
            toggle={toggleLanguage}
            clearAll={clearAllLanguages}
          />
        </div>

        <div class="videos-layout">
          <For each={videos()}>
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
