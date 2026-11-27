import { useState, useEffect } from 'react';
import { Plus, Video, AlertCircle, RefreshCw } from 'lucide-react';
import {
  fetchVideos,
  createVideo,
  updateVideo,
  deleteVideo,
  getApiErrorMessage,
} from '../../services/api';
import { Skeleton, ColdStartBanner } from '../common/Skeleton';
import VideoCard from './VideoCard';
import VideoFormModal from './VideoFormModal';

const VideoLibraryPage = () => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [coldStart, setColdStart] = useState(false);
  const [refreshTick, setRefreshTick] = useState(0);

  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [filterChapter, setFilterChapter] = useState('All');

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      if (active) setColdStart(true);
    }, 4500);

    (async () => {
      try {
        const res = await fetchVideos(controller.signal);
        if (!active) return;
        setVideos(Array.isArray(res.data) ? res.data : []);
        setError('');
      } catch (err) {
        if (!active || err?.name === 'CanceledError') return;
        setError(getApiErrorMessage(err, 'Failed to load video library.'));
      } finally {
        if (active) {
          clearTimeout(timer);
          setColdStart(false);
          setLoading(false);
        }
      }
    })();

    return () => {
      active = false;
      clearTimeout(timer);
      controller.abort();
    };
  }, [refreshTick]);

  const handleRefresh = () => {
    setLoading(true);
    setError('');
    setColdStart(false);
    setRefreshTick((t) => t + 1);
  };

  const handleAdd = async (form) => {
    setActionError('');
    await createVideo(form);
    setShowForm(false);
    handleRefresh();
  };

  const handleEdit = async (form) => {
    setActionError('');
    await updateVideo(editTarget.id, form);
    setEditTarget(null);
    setShowForm(false);
    handleRefresh();
  };

  const handleDelete = async (id) => {
    setActionError('');
    try {
      await deleteVideo(id);
      handleRefresh();
    } catch (err) {
      setActionError(getApiErrorMessage(err, 'Could not delete video resource.'));
    }
  };

  const allChapters = ['All', ...new Set(videos.map((v) => v.chapter).filter(Boolean))];
  const filtered =
    filterChapter === 'All' ? videos : videos.filter((v) => v.chapter === filterChapter);

  return (
    <div className="flex flex-col gap-6">
      <ColdStartBanner visible={coldStart} onRetry={handleRefresh} />

      {/* Standard Editorial Page Header on Paper Canvas */}
      <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 pb-4 border-b border-border">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-1">
            Remediation Media
          </p>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Video Library</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Register YouTube walkthroughs tagged to chapters and Bloom&apos;s levels for automatic question linking.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setEditTarget(null);
            setShowForm(true);
          }}
          className="self-start sm:self-auto inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity shrink-0"
        >
          <Plus size={15} /> Add Video
        </button>
      </header>

      {actionError && (
        <div
          role="alert"
          className="flex items-center gap-2 px-4 py-3 rounded-lg border border-destructive/30 bg-destructive/10 text-sm text-destructive"
        >
          <AlertCircle size={15} className="shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {videos.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {allChapters.map((ch) => (
            <button
              key={ch}
              type="button"
              onClick={() => setFilterChapter(ch)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-full border transition-colors ${
                filterChapter === ch
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-card text-muted-foreground border-border hover:bg-accent hover:text-foreground'
              }`}
            >
              {ch === 'All' ? `All (${videos.length})` : ch}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((n) => (
            <Skeleton key={n} className="h-64 w-full rounded-xl" />
          ))}
        </div>
      ) : error ? (
        <div className="bg-card rounded-xl border border-border p-10 text-center space-y-3">
          <AlertCircle size={28} className="mx-auto text-destructive" />
          <p className="text-sm font-medium text-destructive">{error}</p>
          <button
            type="button"
            onClick={handleRefresh}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg border border-border hover:bg-accent"
          >
            <RefreshCw size={12} /> Retry
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-card rounded-xl border border-border p-12 text-center shadow-2xs">
          <div className="w-12 h-12 rounded-xl bg-muted border border-border flex items-center justify-center mx-auto mb-4">
            <Video size={22} className="text-muted-foreground" />
          </div>
          <h3 className="font-serif text-xl font-bold text-foreground mb-1.5">
            {videos.length === 0 ? 'No videos in your library yet' : 'No videos for this chapter'}
          </h3>
          <p className="text-sm text-muted-foreground mb-5 max-w-md mx-auto">
            Add unlisted or public YouTube explanations tagged by chapter and Bloom&apos;s level. Matching questions will display them automatically.
          </p>
          <button
            type="button"
            onClick={() => {
              setEditTarget(null);
              setShowForm(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
          >
            <Plus size={15} /> Add First Video
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((video) => (
            <VideoCard
              key={video.id}
              video={video}
              onEdit={(v) => {
                setEditTarget(v);
                setShowForm(true);
              }}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {showForm && (
        <VideoFormModal
          initial={editTarget}
          onSave={editTarget ? handleEdit : handleAdd}
          onClose={() => {
            setShowForm(false);
            setEditTarget(null);
          }}
        />
      )}
    </div>
  );
};

export default VideoLibraryPage;
