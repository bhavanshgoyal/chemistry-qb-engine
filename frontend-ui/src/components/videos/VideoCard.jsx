import { useState } from 'react';
import { Pencil, Trash2, ExternalLink, Play, Video, Check, X } from 'lucide-react';
import BloomBadge from '../common/BloomBadge';
import MathText from '../common/MathText';
import { extractYouTubeId, toYouTubeEmbedUrl } from '../../data/syllabus';

const VideoCard = ({ video, onEdit, onDelete }) => {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [previewEmbed, setPreviewEmbed] = useState(false);

  const ytId = extractYouTubeId(video.youtubeUrl);
  const embedUrl = toYouTubeEmbedUrl(video.youtubeUrl);

  const handleConfirmDelete = async () => {
    setDeleting(true);
    try {
      await onDelete(video.id);
    } finally {
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  return (
    <article className="bg-card rounded-xl border border-border shadow-xs overflow-hidden flex flex-col">
      {/* Thumbnail or Inline Embed */}
      <div className="relative aspect-video bg-muted border-b border-border overflow-hidden">
        {previewEmbed && embedUrl ? (
          <iframe
            className="w-full h-full"
            src={embedUrl}
            title={video.title}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <>
            {ytId ? (
              <img
                src={`https://img.youtube.com/vi/${ytId}/hqdefault.jpg`}
                alt={video.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                <Video size={28} />
              </div>
            )}

            <div className="absolute inset-0 bg-foreground/15 flex items-center justify-center gap-2">
              {embedUrl && (
                <button
                  type="button"
                  onClick={() => setPreviewEmbed(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-xs font-semibold shadow-sm hover:opacity-95 transition-opacity"
                >
                  <Play size={12} fill="currentColor" /> Preview
                </button>
              )}
              <a
                href={video.youtubeUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-card text-foreground border border-border text-xs font-semibold shadow-sm hover:bg-accent transition-colors"
                aria-label={`Open ${video.title} on YouTube`}
              >
                <ExternalLink size={12} />
              </a>
            </div>
          </>
        )}
      </div>

      {/* Card Body */}
      <div className="p-4 flex-1 flex flex-col gap-2.5">
        <div className="flex flex-wrap items-center gap-1.5">
          {video.chapter && (
            <span className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold bg-primary/10 text-primary border border-primary/20">
              {video.chapter}
            </span>
          )}
          {video.bloomLevel && <BloomBadge level={video.bloomLevel} showCode />}
        </div>

        <h3 className="font-serif text-base font-bold text-foreground leading-snug">
          {video.title}
        </h3>

        {(video.topic || video.subTopic) && (
          <p className="text-xs font-medium text-muted-foreground">
            {video.topic}
            {video.subTopic ? ` · ${video.subTopic}` : ''}
          </p>
        )}

        {video.description && (
          <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
            <MathText text={video.description} />
          </p>
        )}

        {/* Actions */}
        <div className="mt-auto pt-3 border-t border-border flex items-center gap-2">
          {!confirmDelete ? (
            <>
              <button
                type="button"
                onClick={() => onEdit(video)}
                className="flex-1 inline-flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold rounded-md border border-border bg-background hover:bg-accent transition-colors"
              >
                <Pencil size={12} /> Edit
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="flex-1 inline-flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold rounded-md border border-destructive/25 text-destructive hover:bg-destructive/10 transition-colors"
              >
                <Trash2 size={12} /> Delete
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                disabled={deleting}
                onClick={handleConfirmDelete}
                className="flex-1 inline-flex items-center justify-center gap-1 py-1.5 text-xs font-semibold rounded-md bg-destructive text-destructive-foreground hover:opacity-90 disabled:opacity-50"
              >
                <Check size={12} /> {deleting ? 'Deleting…' : 'Confirm'}
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={() => setConfirmDelete(false)}
                className="flex-1 inline-flex items-center justify-center gap-1 py-1.5 text-xs font-semibold rounded-md border border-border hover:bg-accent"
              >
                <X size={12} /> Cancel
              </button>
            </>
          )}
        </div>
      </div>
    </article>
  );
};

export default VideoCard;
