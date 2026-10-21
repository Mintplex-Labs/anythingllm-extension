import React from "react";
import { File } from "@phosphor-icons/react";
import { isImageFile } from "@/utils/attachments";
import ContextCard from "../ContextCard";

/**
 * @param {Object} props
 * @param {import("@/utils/attachments").Attachment} props.attachment
 * @param {() => void} [props.onRemove]
 * @param {string} [props.background] - passed through to ContextCard
 */
export default function AttachmentCard({
  attachment,
  onRemove = null,
  background = undefined,
}) {
  const image = isImageFile(attachment);
  return (
    <ContextCard
      icon={
        image ? (
          <img
            src={attachment.contentString}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          <File size={18} className="text-white light:text-slate-700" />
        )
      }
      title={attachment.name}
      subtitle={image ? "Image" : "File"}
      onRemove={onRemove}
      background={background}
    />
  );
}
