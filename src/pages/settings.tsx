import { useEffect, useState } from "react";
import { useWebRWKVChat } from "../web-rwkv-wasm-port/web-rwkv";
import { cn, formatFileSize } from "../utils/utils";
import { RadioGroup, RadioGroupOption } from "../components/RadioGroup";
import { createModalForm, Modal } from "../components/popup/Modals";
import {
  createContextMenu,
  Menu,
  MenuItem,
} from "../components/popup/ContentMenu";
import { Card, CardTitle, Entry } from "../components/Cards";
import { ModelLoaderCard } from "../components/ModelConfigUI";
import {
  useChatModelSession,
  useIndexedDBCache,
  useModelStorage,
} from "../store/ModelStorage";
import { useChatSessionStore } from "../store/ChatSessionStorage";
import { usePageStorage } from "../store/PageStorage";
import { Button } from "../components/Button";

import { Trans } from "@lingui/react/macro";
import { i18nSetLocale } from "../i18n";

export default function Settings() {
  const webRWKVLLMInfer = useChatModelSession((s) => s.llmModel);
  const { selectedModelTitle, unloadModel } = useWebRWKVChat(webRWKVLLMInfer);

  const { getTotalCacheSize, clearCache } = useIndexedDBCache((s) => s);
  const [totalCacheSize, setTotalCacheSize] = useState<number>(-1);
  const clearAllSession = useChatSessionStore((state) => state.clearAllSession);

  const { recentModels, deleteRecentModel } = useModelStorage((s) => s);

  const {
    alwaysOpenSessionConfigurationPannel,
    setAlwaysOpenSessionConfigurationPannel,
    setTheme,
    theme,
    showReasoningContentByDefault,
    setShowReasoningContentByDefault,
  } = usePageStorage((s) => s);

  const LanguageMenu = createContextMenu(
    <Menu>
      <MenuItem
        onTrigger={() => {
          i18nSetLocale("zh");
        }}
      >
        中文
      </MenuItem>
      <MenuItem
        onTrigger={() => {
          i18nSetLocale("en");
        }}
      >
        English
      </MenuItem>
    </Menu>,
  );
  const ClearAllConversationsConfirmMenu = createContextMenu(
    <Menu>
      <MenuItem
        className={"text-red-500"}
        onTrigger={() => {
          clearAllSession();
        }}
      >
        <Trans>Confirm</Trans>
      </MenuItem>
    </Menu>,
  );

  const resetAllData = async () => {
    try {
      const { isReset } = await createModalForm(
        <Card className="m-4 max-w-sm bg-white">
          <CardTitle className="bg-white text-red-500">
            <span className="text-lg font-bold">
              <Trans>Reset</Trans>
            </span>
          </CardTitle>
          <div className="flex flex-col gap-1 text-wrap text-sm text-gray-600">
            <p>
              <Trans>
                This will clear your chat history and cache, and may resolve
                some issues. This is irreversible.
              </Trans>
            </p>
            <p className="mt-4 text-gray-400">
              <Trans>Default: No</Trans>
            </p>
          </div>
          <div className="-mb-1 flex justify-end gap-2">
            <Button
              type="submit"
              className="cursor-pointer rounded-xl bg-transparent px-4 py-2 font-semibold active:scale-95"
              name="isReset"
              value={"No"}
            >
              <Trans>No</Trans>
            </Button>
            <Button
              type="submit"
              className="cursor-pointer rounded-xl bg-transparent px-4 py-2 active:scale-95"
              name="isReset"
              value={"Yes"}
            >
              <Trans>Yes</Trans>
            </Button>
          </div>
        </Card>,
        { closeOnBackgroundClick: true },
      ).open();
      if (isReset === "Yes") {
        await clearAllCache();
        clearAllSession();
        window.location.hash = "";
        localStorage.clear();
        window.location.reload();
      }
    } catch (error) {}
  };

  const clearAllCache = async () => {
    recentModels.forEach((v) => {
      deleteRecentModel({ title: v.title, deleteCacheOnly: true });
    });
    await clearCache();
    setTotalCacheSize(await getTotalCacheSize());
  };

  useEffect(() => {
    (async () => {
      setTotalCacheSize(await getTotalCacheSize());
    })();
  }, [recentModels]);
  return (
    <div className="flex h-full w-full flex-col items-stretch">
      <div className="sticky top-0 h-16"></div>
      <div
        className="flex flex-1 flex-shrink-0 flex-col items-center overflow-auto px-2 pb-4 md:px-4 md:pb-0"
        style={{ scrollbarGutter: "stable both-edges" }}
      >
        <div className="flex w-full max-w-screen-md flex-col gap-4 px-2 motion-translate-y-in-[20%] motion-opacity-in-[0%] motion-duration-[0.4s] md:gap-8">
          <h1 className="py-2 pb-8 pl-4 text-5xl">
            <Trans>Settings</Trans>
          </h1>
          <Card
            title={<Trans>Language Model</Trans>}
            icon={
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="size-5"
              >
                <path d="M10.362 1.093a.75.75 0 0 0-.724 0L2.523 5.018 10 9.143l7.477-4.125-7.115-3.925ZM18 6.443l-7.25 4v8.25l6.862-3.786A.75.75 0 0 0 18 14.25V6.443ZM9.25 18.693v-8.25l-7.25-4v7.807a.75.75 0 0 0 .388.657l6.862 3.786Z" />
              </svg>
            }
          >
            <Entry label={<Trans>Loaded model</Trans>}>
              {selectedModelTitle || <Trans>No model loaded</Trans>}
              {selectedModelTitle && (
                <Button
                  onClick={() => {
                    unloadModel();
                  }}
                >
                  <Trans>Unload</Trans>
                </Button>
              )}
            </Entry>
            <Modal
              trigger={
                <div className="-mb-1 flex min-h-10 cursor-pointer items-center justify-start gap-2 rounded-xl bg-[image:var(--web-rwkv-title-gradient)] px-2 font-bold text-white transition-all active:scale-[0.98] md:active:scale-[0.98]">
                  <div className="flex-1">
                    <Trans>Click to open Model loader</Trans>
                  </div>
                  <div>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="size-5"
                    >
                      <path
                        fillRule="evenodd"
                        d="M3 10a.75.75 0 0 1 .75-.75h10.638L10.23 5.29a.75.75 0 1 1 1.04-1.08l5.5 5.25a.75.75 0 0 1 0 1.08l-5.5 5.25a.75.75 0 1 1-1.04-1.08l4.158-3.96H3.75A.75.75 0 0 1 3 10Z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                </div>
              }
            >
              {({ close }) => {
                return <ModelLoaderCard close={close}></ModelLoaderCard>;
              }}
            </Modal>
          </Card>
          <Card
            title={<Trans>Appearance</Trans>}
            icon={
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="size-5"
              >
                <path d="M16.555 5.412a8.028 8.028 0 0 0-3.503-2.81 14.899 14.899 0 0 1 1.663 4.472 8.547 8.547 0 0 0 1.84-1.662ZM13.326 7.825a13.43 13.43 0 0 0-2.413-5.773 8.087 8.087 0 0 0-1.826 0 13.43 13.43 0 0 0-2.413 5.773A8.473 8.473 0 0 0 10 8.5c1.18 0 2.304-.24 3.326-.675ZM6.514 9.376A9.98 9.98 0 0 0 10 10c1.226 0 2.4-.22 3.486-.624a13.54 13.54 0 0 1-.351 3.759A13.54 13.54 0 0 1 10 13.5c-1.079 0-2.128-.127-3.134-.366a13.538 13.538 0 0 1-.352-3.758ZM5.285 7.074a14.9 14.9 0 0 1 1.663-4.471 8.028 8.028 0 0 0-3.503 2.81c.529.638 1.149 1.199 1.84 1.66ZM17.334 6.798a7.973 7.973 0 0 1 .614 4.115 13.47 13.47 0 0 1-3.178 1.72 15.093 15.093 0 0 0 .174-3.939 10.043 10.043 0 0 0 2.39-1.896ZM2.666 6.798a10.042 10.042 0 0 0 2.39 1.896 15.196 15.196 0 0 0 .174 3.94 13.472 13.472 0 0 1-3.178-1.72 7.973 7.973 0 0 1 .615-4.115ZM10 15c.898 0 1.778-.079 2.633-.23a13.473 13.473 0 0 1-1.72 3.178 8.099 8.099 0 0 1-1.826 0 13.47 13.47 0 0 1-1.72-3.178c.855.151 1.735.23 2.633.23ZM14.357 14.357a14.912 14.912 0 0 1-1.305 3.04 8.027 8.027 0 0 0 4.345-4.345c-.953.542-1.971.981-3.04 1.305ZM6.948 17.397a8.027 8.027 0 0 1-4.345-4.345c.953.542 1.971.981 3.04 1.305a14.912 14.912 0 0 0 1.305 3.04Z" />
              </svg>
            }
          >
            <Entry label={<Trans>Language</Trans>}>
              <LanguageMenu.ContextMenuTrigger
                click={true}
                position="bottom right"
              >
                <span>
                  <Button
                    onClick={async () => {
                      setTotalCacheSize(await getTotalCacheSize());
                    }}
                    className="flex items-center justify-center gap-2"
                  >
                    <Trans>Current Language</Trans>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="size-6"
                    >
                      <path
                        fillRule="evenodd"
                        d="M9 2.25a.75.75 0 0 1 .75.75v1.506a49.384 49.384 0 0 1 5.343.371.75.75 0 1 1-.186 1.489c-.66-.083-1.323-.151-1.99-.206a18.67 18.67 0 0 1-2.97 6.323c.318.384.65.753 1 1.107a.75.75 0 0 1-1.07 1.052A18.902 18.902 0 0 1 9 13.687a18.823 18.823 0 0 1-5.656 4.482.75.75 0 0 1-.688-1.333 17.323 17.323 0 0 0 5.396-4.353A18.72 18.72 0 0 1 5.89 8.598a.75.75 0 0 1 1.388-.568A17.21 17.21 0 0 0 9 11.224a17.168 17.168 0 0 0 2.391-5.165 48.04 48.04 0 0 0-8.298.307.75.75 0 0 1-.186-1.489 49.159 49.159 0 0 1 5.343-.371V3A.75.75 0 0 1 9 2.25ZM15.75 9a.75.75 0 0 1 .68.433l5.25 11.25a.75.75 0 1 1-1.36.634l-1.198-2.567h-6.744l-1.198 2.567a.75.75 0 0 1-1.36-.634l5.25-11.25A.75.75 0 0 1 15.75 9Zm-2.672 8.25h5.344l-2.672-5.726-2.672 5.726Z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </Button>
                </span>
              </LanguageMenu.ContextMenuTrigger>
            </Entry>
            <Entry label={<Trans>Color preference</Trans>}>
              <RadioGroup
                className="-m-2 h-10 gap-1 bg-slate-200 p-1"
                value={theme}
                onChange={(value) => {
                  setTheme(value);
                }}
              >
                <RadioGroupOption value={"light"}>
                  <Trans>Light</Trans>
                </RadioGroupOption>
                <RadioGroupOption value={"dark"}>
                  <Trans>Dark</Trans>
                </RadioGroupOption>
                <RadioGroupOption value={"auto"}>
                  <Trans>Auto</Trans>
                </RadioGroupOption>
              </RadioGroup>
            </Entry>
            <Entry
              label={<Trans>Always open session configuration pannel</Trans>}
              className="max-md:text-sm"
            >
              <RadioGroup
                className="-m-2 h-10 gap-1 bg-slate-200 p-1"
                value={
                  alwaysOpenSessionConfigurationPannel === null
                    ? "unset"
                    : alwaysOpenSessionConfigurationPannel
                      ? "Yes"
                      : "No"
                }
                onChange={(value) => {
                  setAlwaysOpenSessionConfigurationPannel(value === "Yes");
                }}
              >
                <RadioGroupOption value={"Yes"}>
                  <Trans>Yes</Trans>
                </RadioGroupOption>
                <RadioGroupOption value={"No"}>
                  <Trans>No</Trans>
                </RadioGroupOption>
              </RadioGroup>
            </Entry>
            <Entry
              label={<Trans>Show reasoning content by default</Trans>}
              className="max-md:text-sm"
            >
              <RadioGroup
                className="-m-2 h-10 gap-1 bg-slate-200 p-1"
                value={
                  showReasoningContentByDefault === null
                    ? "unset"
                    : showReasoningContentByDefault
                      ? "Yes"
                      : "No"
                }
                onChange={(value) => {
                  setShowReasoningContentByDefault(value === "Yes");
                }}
              >
                <RadioGroupOption value={"Yes"}>
                  <Trans>Yes</Trans>
                </RadioGroupOption>
                <RadioGroupOption value={"No"}>
                  <Trans>No</Trans>
                </RadioGroupOption>
              </RadioGroup>
            </Entry>
          </Card>
          <Card
            title={<Trans>Data</Trans>}
            icon={
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="size-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125"
                />
              </svg>
            }
          >
            <Entry label={<Trans>Clear all conversations</Trans>}>
              <ClearAllConversationsConfirmMenu.ContextMenuTrigger
                click={true}
                position={"bottom right"}
              >
                {/* <span> */}
                <Button className="text-red-500">
                  <Trans>Clear</Trans>
                </Button>
                {/* </span> */}
              </ClearAllConversationsConfirmMenu.ContextMenuTrigger>
            </Entry>
            <Entry label={<Trans>Total cache size</Trans>}>
              <Button
                onClick={async () => {
                  setTotalCacheSize(await getTotalCacheSize());
                }}
                className="flex items-center justify-center gap-2 bg-white/0 dark:bg-white/0"
              >
                {totalCacheSize < 0 ? "Check" : formatFileSize(totalCacheSize)}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 16 16"
                  fill="currentColor"
                  className="size-4 text-gray-600 dark:text-zinc-400"
                >
                  <path
                    fillRule="evenodd"
                    d="M13.836 2.477a.75.75 0 0 1 .75.75v3.182a.75.75 0 0 1-.75.75h-3.182a.75.75 0 0 1 0-1.5h1.37l-.84-.841a4.5 4.5 0 0 0-7.08.932.75.75 0 0 1-1.3-.75 6 6 0 0 1 9.44-1.242l.842.84V3.227a.75.75 0 0 1 .75-.75Zm-.911 7.5A.75.75 0 0 1 13.199 11a6 6 0 0 1-9.44 1.241l-.84-.84v1.371a.75.75 0 0 1-1.5 0V9.591a.75.75 0 0 1 .75-.75H5.35a.75.75 0 0 1 0 1.5H3.98l.841.841a4.5 4.5 0 0 0 7.08-.932.75.75 0 0 1 1.025-.273Z"
                    clipRule="evenodd"
                  />
                </svg>
              </Button>
            </Entry>
            <Entry label={<Trans>Clear Cache</Trans>}>
              <Button className="text-red-500" onClick={clearAllCache}>
                <Trans>Clear</Trans>
              </Button>
            </Entry>
            <hr className="border-1"></hr>
            <Entry label={<Trans>Reset All Data</Trans>}>
              <Button className="text-red-500" onClick={resetAllData}>
                <Trans> Reset</Trans>
              </Button>
            </Entry>
          </Card>
          <div className="flex h-36 flex-col items-center justify-center pb-6">
            <h2 className="text-lg text-slate-300">
              <span>
                <Trans>Made with ♥ by Leon</Trans>
              </span>
            </h2>
            <h3 className="text-xs text-slate-300">
              <Trans>
                Last Commit at {import.meta.env.VITE_GIT_COMMIT_DATE}
              </Trans>
            </h3>
            <h3 className="text-xs text-slate-300">
              {import.meta.env.VITE_GIT_BRANCH} · {import.meta.env.VITE_GIT_SHA}
            </h3>
          </div>
        </div>
      </div>
    </div>
  );
}
