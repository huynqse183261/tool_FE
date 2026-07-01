import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getPostDetailApi,
  updateDraftApi,
  generateCaptionApi,
  regenerateCaptionApi,
  schedulePostApi,
  cancelScheduleApi,
  publishPostApi,
} from "../../api/postApi";
import Navbar from "../../components/Navbar/Navbar";
import "./DraftDetailPage.scss";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const DraftDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [scheduling, setScheduling] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });

  const [caption, setCaption] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [scheduledAt, setScheduledAt] = useState(null);
  const [selectedPlatforms, setSelectedPlatforms] = useState(["Facebook"]);

  // Generate caption request params
  const [generateParams, setGenerateParams] = useState({
    contentType: "ProductShowcase",
    sceneType: "",
    productName: "",
    sku: "",
    scale: "",
  });

  const fetchPost = async () => {
    try {
      const res = await getPostDetailApi(id);
      const data = res.data.data;
      setPost(data);
      setCaption(data.caption || "");
      setHashtags(data.hashtags || "");
      if (data.scheduledAt) {
        setScheduledAt(new Date(data.scheduledAt));
      }
    } catch (err) {
      console.error("Failed to fetch post:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchPost();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const showMessage = (text, type = "success") => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: "", type: "" }), 3000);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateDraftApi(id, { caption, hashtags });
      showMessage("Draft saved successfully");
    } catch (err) {
      showMessage(err.response?.data?.message || "Save failed", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await generateCaptionApi(id, generateParams);
      const data = res.data.data;
      setCaption(data.caption || "");
      setHashtags(data.hashtags?.join(" ") || "");
      showMessage("Caption generated");
    } catch (err) {
      showMessage(err.response?.data?.message || "Generate failed", "error");
    } finally {
      setGenerating(false);
    }
  };

  const handleRegenerate = async () => {
    setGenerating(true);
    try {
      const res = await regenerateCaptionApi(id);
      const data = res.data.data;
      setCaption(data.caption || caption);
      showMessage("Caption regenerated");
    } catch (err) {
      showMessage(err.response?.data?.message || "Regenerate failed", "error");
    } finally {
      setGenerating(false);
    }
  };

  const handleSchedule = async () => {
    if (!scheduledAt) {
      showMessage("Please select a date and time", "error");
      return;
    }
    setScheduling(true);
    try {
      await schedulePostApi(id, {
        scheduledAt: scheduledAt.toISOString(),
        platforms: selectedPlatforms,
      });
      showMessage("Post scheduled successfully");
      fetchPost();
    } catch (err) {
      showMessage(err.response?.data?.message || "Schedule failed", "error");
    } finally {
      setScheduling(false);
    }
  };

  const handleCancelSchedule = async () => {
    if (!window.confirm("Cancel this schedule?")) return;
    setScheduling(true);
    try {
      await cancelScheduleApi(id);
      showMessage("Schedule cancelled");
      fetchPost();
    } catch (err) {
      showMessage(err.response?.data?.message || "Cancel failed", "error");
    } finally {
      setScheduling(false);
    }
  };

  const handlePublish = async () => {
    if (!window.confirm("Publish this post now?")) return;
    setPublishing(true);
    try {
      await publishPostApi(id, { caption });
      showMessage("Published successfully");
      fetchPost();
    } catch (err) {
      showMessage(err.response?.data?.message || "Publish failed", "error");
    } finally {
      setPublishing(false);
    }
  };

  const togglePlatform = (platform) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platform)
        ? prev.filter((p) => p !== platform)
        : [...prev, platform],
    );
  };

  if (loading)
    return (
      <div className="draft-detail-page">
        <Navbar />
        <div className="draft-detail-loading">Loading...</div>
      </div>
    );

  if (!post)
    return (
      <div className="draft-detail-page">
        <Navbar />
        <div className="draft-detail-loading">Post not found.</div>
      </div>
    );

  const isScheduled = post.status === "Scheduled";
  const isPublished = post.status === "Published";

  return (
    <div className="draft-detail-page">
      <Navbar />
      <div className="draft-detail-content">
        {/* Header */}
        <div className="draft-detail-header">
          <button
            className="draft-detail-header__back"
            onClick={() => navigate("/drafts")}
          >
            ← Back
          </button>
          <div className="draft-detail-header__status">
            Status:{" "}
            <span
              className={`status-badge status-badge--${post.status?.toLowerCase()}`}
            >
              {post.status}
            </span>
          </div>
        </div>

        {/* Message */}
        {message.text && (
          <div
            className={`draft-detail-message draft-detail-message--${message.type}`}
          >
            {message.text}
          </div>
        )}

        <div className="draft-detail-layout">
          {/* Left — Images */}
          <div className="draft-detail-images">
            <h3>Images</h3>
            <div className="draft-detail-images__grid">
              {post.images?.map((img) => (
                <img
                  key={img.id}
                  src={img.imageUrl}
                  alt={`Image ${img.displayOrder}`}
                />
              ))}
            </div>
          </div>

          {/* Right — Editor */}
          <div className="draft-detail-editor">
            {/* Generate Caption */}
            {!isPublished && (
              <div className="editor-section">
                <h3>Generate Caption</h3>
                <div className="editor-section__row">
                  <select
                    value={generateParams.contentType}
                    onChange={(e) =>
                      setGenerateParams({
                        ...generateParams,
                        contentType: e.target.value,
                      })
                    }
                  >
                    <option value="ProductShowcase">Product Showcase</option>
                    <option value="Storytelling">Storytelling</option>
                    <option value="EventRecap">Event Recap</option>
                  </select>

                  <select
                    value={generateParams.sceneType}
                    onChange={(e) =>
                      setGenerateParams({
                        ...generateParams,
                        sceneType: e.target.value,
                      })
                    }
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
                    onChange={(e) =>
                      setGenerateParams({
                        ...generateParams,
                        productName: e.target.value,
                      })
                    }
                  />
                  <input
                    type="text"
                    placeholder="SKU"
                    value={generateParams.sku}
                    onChange={(e) =>
                      setGenerateParams({
                        ...generateParams,
                        sku: e.target.value,
                      })
                    }
                  />
                  <input
                    type="text"
                    placeholder="Scale (e.g. 1:64)"
                    value={generateParams.scale}
                    onChange={(e) =>
                      setGenerateParams({
                        ...generateParams,
                        scale: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="editor-section__buttons">
                  <button
                    className="btn btn--primary"
                    onClick={handleGenerate}
                    disabled={generating}
                  >
                    {generating ? "Generating..." : "✨ Generate"}
                  </button>
                  {post.status !== "Draft" || caption ? (
                    <button
                      className="btn btn--secondary"
                      onClick={handleRegenerate}
                      disabled={generating}
                    >
                      {generating ? "Regenerating..." : "🔄 Regenerate"}
                    </button>
                  ) : null}
                </div>
              </div>
            )}

            {/* Caption Editor */}
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

            {/* Save */}
            {!isPublished && (
              <button
                className="btn btn--primary"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? "Saving..." : "💾 Save Draft"}
              </button>
            )}

            {/* Schedule */}
            {!isPublished && (
              <div className="editor-section">
                <h3>Schedule</h3>

                <div className="editor-section__platforms">
                  {["Facebook", "Instagram"].map((platform) => (
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
                      scheduledAt &&
                      scheduledAt.toDateString() === new Date().toDateString()
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
                    <button
                      className="btn btn--gold"
                      onClick={handleSchedule}
                      disabled={scheduling}
                    >
                      {scheduling ? "Scheduling..." : "📅 Schedule Post"}
                    </button>
                  ) : (
                    <button
                      className="btn btn--danger"
                      onClick={handleCancelSchedule}
                      disabled={scheduling}
                    >
                      {scheduling ? "Cancelling..." : "❌ Cancel Schedule"}
                    </button>
                  )}

                  <button
                    className="btn btn--secondary"
                    onClick={handlePublish}
                    disabled={publishing || isPublished}
                  >
                    {publishing ? "Publishing..." : "🚀 Publish Now"}
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
      </div>
    </div>
  );
};

export default DraftDetailPage;
