import { useState } from 'react';
import {
  updateDraftApi,
  schedulePostApi,
  cancelScheduleApi,
  publishVideoApi,
} from '../../api/postApi';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

// Editor for video-type posts — manual caption, schedule, publish video to Facebook
const VideoPostEditor = ({ post, postId, showMessage, refetchPost }) => {
  const [caption, setCaption] = useState(post.caption || '');
  const [hashtags, setHashtags] = useState(post.hashtags || '');
  const [scheduledAt, setScheduledAt] = useState(post.scheduledAt ? new Date(post.scheduledAt) : null);
  const [selectedPlatforms, setSelectedPlatforms] = useState(['Facebook']);

  const [saving, setSaving] = useState(false);
  const [scheduling, setScheduling] = useState(false);
  const [publishing, setPublishing] = useState(false);

  const isScheduled = post.status === 'Scheduled';
  const isPublished = post.status === 'Published';

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateDraftApi(postId, { caption, hashtags });
      showMessage('Draft saved successfully');
    } catch (err) {
      showMessage(err.response?.data?.message || 'Save failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSchedule = async () => {
    if (!scheduledAt) {
      showMessage('Please select a date and time', 'error');
      return;
    }
    setScheduling(true);
    try {
      await schedulePostApi(postId, {
        scheduledAt: scheduledAt.toISOString(),
        platforms: selectedPlatforms,
      });
      showMessage('Video scheduled successfully');
      refetchPost();
    } catch (err) {
      showMessage(err.response?.data?.message || 'Schedule failed', 'error');
    } finally {
      setScheduling(false);
    }
  };

  const handleCancelSchedule = async () => {
    if (!window.confirm('Cancel this schedule?')) return;
    setScheduling(true);
    try {
      await cancelScheduleApi(postId);
      showMessage('Schedule cancelled');
      refetchPost();
    } catch (err) {
      showMessage(err.response?.data?.message || 'Cancel failed', 'error');
    } finally {
      setScheduling(false);
    }
  };

  const handlePublishVideo = async () => {
    if (!window.confirm('Publish this video to Facebook?')) return;
    setPublishing(true);
    try {
      await publishVideoApi(postId, { caption });
      showMessage('Video published successfully');
      refetchPost();
    } catch (err) {
      showMessage(err.response?.data?.message || 'Publish failed', 'error');
    } finally {
      setPublishing(false);
    }
  };

  const togglePlatform = (platform) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platform)
        ? prev.filter((p) => p !== platform)
        : [...prev, platform]
    );
  };

  return (
    <div className="draft-detail-layout">

      {/* Left — video preview */}
      <div className="draft-detail-images">
        <h3>Video</h3>
        {post.videoUrl ? (
          <video
            src={post.videoUrl}
            controls
            className="video-preview"
          />
        ) : (
          <div className="draft-detail-images__no-video">No video uploaded</div>
        )}
      </div>

      {/* Right — editor */}
      <div className="draft-detail-editor">

        {/* Caption — manual write only, no AI */}
        <div className="editor-section">
          <h3>Caption</h3>
          <textarea
            className="editor-section__textarea"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Write your video caption here..."
            rows={10}
            disabled={isPublished}
          />
        </div>

        {/* Hashtags */}
        <div className="editor-section">
          <h3>Hashtags</h3>
          <input
            className="editor-section__input"
            type="text"
            value={hashtags}
            onChange={(e) => setHashtags(e.target.value)}
            placeholder="#GRE911 #diecast #diorama"
            disabled={isPublished}
          />
        </div>

        {/* Save */}
        {!isPublished && (
          <button className="btn btn--primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : '💾 Save Draft'}
          </button>
        )}

        {/* Schedule */}
        {!isPublished && (
          <div className="editor-section">
            <h3>Schedule</h3>
            <div className="editor-section__platforms">
              {['Facebook'].map((platform) => (
                <label key={platform} className="platform-checkbox">
                  <input
                    type="checkbox"
                    checked={selectedPlatforms.includes(platform)}
                    onChange={() => togglePlatform(platform)}
                    disabled={isScheduled}
                  />
                  {platform}
                </label>
              ))}
            </div>
            <div className="schedule-datetime">
              <DatePicker
                selected={scheduledAt}
                onChange={(date) => setScheduledAt(date)}
                showTimeSelect
                timeIntervals={10}
                dateFormat="dd/MM/yyyy HH:mm"
                minDate={new Date()}
                minTime={
                  scheduledAt && scheduledAt.toDateString() === new Date().toDateString()
                    ? new Date()
                    : new Date(0, 0, 0, 0, 0)
                }
                maxTime={new Date(0, 0, 0, 23, 45)}
                placeholderText="Select date and time"
                disabled={isScheduled}
                className="editor-section__input"
              />
            </div>
            <div className="editor-section__buttons">
              {!isScheduled ? (
                <button className="btn btn--gold" onClick={handleSchedule} disabled={scheduling}>
                  {scheduling ? 'Scheduling...' : '📅 Schedule Video'}
                </button>
              ) : (
                <button className="btn btn--danger" onClick={handleCancelSchedule} disabled={scheduling}>
                  {scheduling ? 'Cancelling...' : '❌ Cancel Schedule'}
                </button>
              )}
              <button
                className="btn btn--secondary"
                onClick={handlePublishVideo}
                disabled={publishing || isPublished}
              >
                {publishing ? 'Publishing...' : '🎬 Publish Video Now'}
              </button>
            </div>
          </div>
        )}

        {isPublished && (
          <div className="draft-detail-published">
            ✅ Video published successfully.
            {post.publishedAt && (
              <span> on {new Date(post.publishedAt).toLocaleString()}</span>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default VideoPostEditor;