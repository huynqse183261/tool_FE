import { useState } from 'react';
import {
  updateDraftApi,
  generateCaptionApi,
  regenerateCaptionApi,
  schedulePostApi,
  cancelScheduleApi,
  publishPostApi,
} from '../../api/postApi';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

// Editor for image-type posts — AI generation, caption edit, scheduling, publish
const ImagePostEditor = ({ post, postId, showMessage, refetchPost }) => {
  const [caption, setCaption] = useState(post.caption || '');
  const [hashtags, setHashtags] = useState(post.hashtags || '');
  const [scheduledAt, setScheduledAt] = useState(post.scheduledAt ? new Date(post.scheduledAt) : null);
  const [selectedPlatforms, setSelectedPlatforms] = useState(['Facebook']);

  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [scheduling, setScheduling] = useState(false);
  const [publishing, setPublishing] = useState(false);

  const [generateParams, setGenerateParams] = useState({
    contentType: '',
    sceneType: '',
    productName: '',
    sku: '',
    scale: '',
  });

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

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await generateCaptionApi(postId, generateParams);
      const generatedData = res.data.data;
      setCaption(generatedData.caption || '');
      setHashtags(generatedData.hashtags?.join(' ') || '');
      showMessage('Caption generated');
    } catch (err) {
      showMessage(err.response?.data?.message || 'Generate failed', 'error');
    } finally {
      setGenerating(false);
    }
  };

  const handleRegenerate = async () => {
    setGenerating(true);
    try {
      const res = await regenerateCaptionApi(postId);
      setCaption(res.data.data?.caption || caption);
      showMessage('Caption regenerated');
    } catch (err) {
      showMessage(err.response?.data?.message || 'Regenerate failed', 'error');
    } finally {
      setGenerating(false);
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
      showMessage('Post scheduled successfully');
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

  const handlePublish = async () => {
    if (!window.confirm('Publish this post now?')) return;
    setPublishing(true);
    try {
      await publishPostApi(postId, { caption });
      showMessage('Published successfully');
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

      {/* Left — image grid */}
      <div className="draft-detail-images">
        <h3>Images</h3>
        <div className="draft-detail-images__grid">
          {post.images?.map((img) => (
            <img key={img.id} src={img.imageUrl} alt={`Image ${img.displayOrder}`} />
          ))}
        </div>
      </div>

      {/* Right — editor */}
      <div className="draft-detail-editor">

        {/* AI Caption Generator */}
        {!isPublished && (
          <div className="editor-section">
            <h3>Generate Caption</h3>
            <div className="editor-section__row">
              <select
                value={generateParams.contentType}
                onChange={(e) => setGenerateParams({ ...generateParams, contentType: e.target.value })}
              >
                <option value="">Select type</option>
                <option value="ProductShowcase">Product Showcase</option>
                <option value="Storytelling">Storytelling</option>
                <option value="EventRecap">Event Recap</option>
              </select>
              <select
                value={generateParams.sceneType}
                onChange={(e) => setGenerateParams({ ...generateParams, sceneType: e.target.value })}
              >
                <option value="">No Scene</option>
                <option value="IndustrialGarage">Industrial Garage</option>
                <option value="JapaneseStreet">Japanese Street</option>
                <option value="GasStation">Gas Station</option>
                <option value="Warehouse">Warehouse</option>
                <option value="UrbanNight">Urban Night</option>
              </select>
            </div>
            <div className="editor-section__row">
              <input
                type="text"
                placeholder="Product Name"
                value={generateParams.productName}
                onChange={(e) => setGenerateParams({ ...generateParams, productName: e.target.value })}
              />
              <input
                type="text"
                placeholder="SKU"
                value={generateParams.sku}
                onChange={(e) => setGenerateParams({ ...generateParams, sku: e.target.value })}
              />
              <input
                type="text"
                placeholder="Scale (e.g. 1:64)"
                value={generateParams.scale}
                onChange={(e) => setGenerateParams({ ...generateParams, scale: e.target.value })}
              />
            </div>
            <div className="editor-section__buttons">
              <button className="btn btn--primary" onClick={handleGenerate} disabled={generating}>
                {generating ? 'Generating...' : '✨ Generate'}
              </button>
              {(post.status !== 'Draft' || caption) && (
                <button className="btn btn--secondary" onClick={handleRegenerate} disabled={generating}>
                  {generating ? 'Regenerating...' : '🔄 Regenerate'}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Caption editor */}
        <div className="editor-section">
          <h3>Caption</h3>
          <textarea
            className="editor-section__textarea"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Caption will appear here after generation..."
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

        {/* Save button */}
        {!isPublished && (
          <button className="btn btn--primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : '💾 Save Draft'}
          </button>
        )}

        {/* Schedule section */}
        {!isPublished && (
          <div className="editor-section">
            <h3>Schedule</h3>
            <div className="editor-section__platforms">
              {['Facebook', 'Instagram'].map((platform) => (
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
                  {scheduling ? 'Scheduling...' : '📅 Schedule Post'}
                </button>
              ) : (
                <button className="btn btn--danger" onClick={handleCancelSchedule} disabled={scheduling}>
                  {scheduling ? 'Cancelling...' : '❌ Cancel Schedule'}
                </button>
              )}
              <button className="btn btn--secondary" onClick={handlePublish} disabled={publishing || isPublished}>
                {publishing ? 'Publishing...' : '🚀 Publish Now'}
              </button>
            </div>
          </div>
        )}

        {isPublished && (
          <div className="draft-detail-published">
            ✅ This post has been published.
            {post.publishedAt && (
              <span> on {new Date(post.publishedAt).toLocaleString()}</span>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default ImagePostEditor;