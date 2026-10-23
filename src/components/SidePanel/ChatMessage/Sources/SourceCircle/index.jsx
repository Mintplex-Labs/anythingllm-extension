import React, { useState } from "react";
import {
  FileText,
  GitBranch,
  GithubLogo,
  GitlabLogo,
  LinkSimple,
  YoutubeLogo,
} from "@phosphor-icons/react";

const KIND_ICONS = {
  youtube: YoutubeLogo,
  github: GithubLogo,
  gitlab: GitlabLogo,
  gitea: GitBranch,
};

/**
 * Round badge for a source: the site favicon for a web page, otherwise an
 * icon for where the document came from.
 * @param {Object} props
 * @param {import("@/utils/sources").SourceGroup} props.source
 * @param {string} props.className - size and any ring, e.g. "w-[18px] h-[18px]"
 */
export default function SourceCircle({ source, className }) {
  const [faviconFailed, setFaviconFailed] = useState(false);
  const Icon = KIND_ICONS[source.kind] ?? (source.url ? LinkSimple : FileText);
  const showFavicon = !KIND_ICONS[source.kind] && source.url && !faviconFailed;

  return (
    <div
      className={`flex items-center justify-center shrink-0 rounded-full overflow-hidden bg-white light:bg-slate-100 text-black ${className}`}
    >
      {showFavicon ? (
        <img
          src={`https://www.google.com/s2/favicons?domain=${new URL(source.url).hostname}&sz=64`}
          alt=""
          className="w-full h-full object-cover"
          onError={() => setFaviconFailed(true)}
        />
      ) : (
        <Icon size={10} weight="bold" />
      )}
    </div>
  );
}
