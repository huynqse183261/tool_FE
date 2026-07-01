import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDraftsApi, deleteDraftApi, uploadPostApi, uploadVideoPostApi } from '../../api/postApi';
import Navbar from '../../components/Navbar/Navbar';
import './DraftListPage.scss';

const STATUS_FILTERS = ['All', 'Draft', 'Scheduled', 'Published', 'Failed'];

const statusColors = {
  Draft: '#666',
  Scheduled: '#c9a84c',
  Publishing: '#4c9ac9',
  Published: '#4caf50',
  Failed: '#e05c5c',
};

const DraftListPage = () => {
  const navigate = useNavigate();
  const [allPosts, setAllPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [activeFilter, setActiveFilter] = useState('All');

  // Upload modal state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFiles, setUploadFiles] = useState([]);
  const [uploadPreviews, setUploadPreviews] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

// Video upload state
const [showVideoModal, setShowVideoModal] = useState(false);
const [videoFile, setVideoFile] = useState(null);
const [videoPreview, setVideoPreview] = useState('');
const [videoCaption, setVideoCaption] = useState('');
const [uploadingVideo, setUploadingVideo] = useState(false);
const [videoError, setVideoError] = useState('');

  const fetchPosts = async () => {
    try {
      const res = await getDraftsApi();
      setAllPosts(res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch posts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchPosts();
  }, []);

  // Filter posts theo status
  const filteredPosts = activeFilter === 'All'
    ? allPosts
    : allPosts.filter((p) => p.status === activeFilter);

  const handleDelete = async (e, postId) => {
    e.stopPropagation();
    if (!window.confirm('Delete this draft?')) return;
    setDeletingId(postId);
    try {
      await deleteDraftApi(postId);
      setAllPosts((prev) => prev.filter((p) => p.id !== postId));
    } catch (err) {
      console.error('Delete failed:', err);
    } finally {
      setDeletingId(null);
    }
  };

  // Xử lý chọn file — tạo preview URLs
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 10) {
      setUploadError('Maximum 10 images allowed');
      return;
    }
    setUploadFiles(files);
    setUploadError('');

    // Tạo preview URLs để hiển thị trước khi upload
    const previews = files.map((file) => URL.createObjectURL(file));
    setUploadPreviews(previews);
  };

  const handleUpload = async () => {
    if (uploadFiles.length === 0) {
      setUploadError('Please select at least one image');
      return;
    }

    setUploading(true);
    setUploadError('');

    try {
      const formData = new FormData();
      uploadFiles.forEach((file) => formData.append('Images', file));

      const res = await uploadPostApi(formData);
      const newPostId = res.data.data.postId;

      // Đóng modal và navigate thẳng vào detail để generate caption
      setShowUploadModal(false);
      resetUploadModal();
      navigate(`/drafts/${newPostId}`);
    } catch (err) {
      setUploadError(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const resetUploadModal = () => {
    setUploadFiles([]);
    setUploadPreviews([]);
    setUploadError('');
  };

  const handleCloseModal = () => {
    setShowUploadModal(false);
    resetUploadModal();
  };
const handleVideoFileChange = (e) => {
  const file = e.target.files[0];
  if (!file) return;

  // Validate size — Facebook max 10GB but keep reasonable limit
  if (file.size > 500 * 1024 * 1024) {
    setVideoError('Video must be under 500MB');
    return;
  }

  setVideoFile(file);
  setVideoPreview(URL.createObjectURL(file));
  setVideoError('');
};

const handleVideoUpload = async () => {
  if (!videoFile) {
    setVideoError('Please select a video file');
    return;
  }

  setUploadingVideo(true);
  setVideoError('');

  try {
    const formData = new FormData();
    formData.append('Video', videoFile);
    formData.append('Caption', videoCaption);

    const res = await uploadVideoPostApi(formData);
    const newPostId = res.data.data.postId;

    setShowVideoModal(false);
    resetVideoModal();
    navigate(`/drafts/${newPostId}`);
  } catch (err) {
    setVideoError(err.response?.data?.message || 'Upload failed');
  } finally {
    setUploadingVideo(false);
  }
};

const resetVideoModal = () => {
  setVideoFile(null);
  setVideoPreview('');
  setVideoCaption('');
  setVideoError('');
};
  return (
    <div className="draft-list-page">
      <Navbar />
      <div className="draft-list-content">

       {/* Header — thêm button video */}
<div className="draft-list-header">
  <h1>Posts</h1>
  <div className="draft-list-header__actions">
    <button className="draft-list-header__new" onClick={() => setShowUploadModal(true)}>
      + New Post
    </button>
    <button className="draft-list-header__video" onClick={() => setShowVideoModal(true)}>
      + New Video
    </button>
  </div>
</div>

{/* Video Upload Modal */}
{showVideoModal && (
  <div className="modal-overlay" onClick={() => { setShowVideoModal(false); resetVideoModal(); }}>
    <div className="modal" onClick={(e) => e.stopPropagation()}>
      <div className="modal__header">
        <h2>Upload Video</h2>
        <button className="modal__close" onClick={() => { setShowVideoModal(false); resetVideoModal(); }}>✕</button>
      </div>

      <div className="modal__body">
        <label className="upload-dropzone">
          <input
            type="file"
            accept="video/mp4,video/quicktime,video/x-msvideo"
            onChange={handleVideoFileChange}
            style={{ display: 'none' }}
          />
          {!videoPreview ? (
            <div className="upload-dropzone__placeholder">
              <span>🎬</span>
              <p>Click to select video</p>
              <small>MP4, MOV, AVI — max 500MB</small>
            </div>
          ) : (
            <video
              src={videoPreview}
              controls
              style={{ width: '100%', borderRadius: '8px', maxHeight: '240px' }}
            />
          )}
        </label>

        <textarea
          className="editor-section__textarea"
          placeholder="Write your caption here..."
          value={videoCaption}
          onChange={(e) => setVideoCaption(e.target.value)}
          rows={4}
          style={{ marginTop: '12px' }}
        />

        {videoError && <p className="modal__error">{videoError}</p>}
      </div>

      <div className="modal__footer">
        <button className="btn btn--secondary" onClick={() => { setShowVideoModal(false); resetVideoModal(); }}>
          Cancel
        </button>
        <button
          className="btn btn--gold"
          onClick={handleVideoUpload}
          disabled={uploadingVideo || !videoFile}
        >
          {uploadingVideo ? 'Uploading...' : 'Upload Video'}
        </button>
      </div>
    </div>
  </div>
)}

        {/* Status Filter */}
        <div className="draft-list-filters">
          {STATUS_FILTERS.map((filter) => (
            <button
              key={filter}
              className={`filter-btn ${activeFilter === filter ? 'filter-btn--active' : ''}`}
              onClick={() => setActiveFilter(filter)}
            >
              {filter}
              <span className="filter-btn__count">
                {filter === 'All'
                  ? allPosts.length
                  : allPosts.filter((p) => p.status === filter).length}
              </span>
            </button>
          ))}
        </div>

        {/* Post Grid */}
        {loading ? (
          <div className="draft-list-empty">Loading...</div>
        ) : filteredPosts.length === 0 ? (
          <div className="draft-list-empty">
            No posts found. Click "+ New Post" to get started.
          </div>
        ) : (
          <div className="draft-list-grid">
            {filteredPosts.map((post) => (
              <div
                key={post.id}
                className="draft-card"
                onClick={() => navigate(`/drafts/${post.id}`)}
              >
                <div className="draft-card__thumbnail">
                  {post.thumbnailUrl ? (
                    <img src={post.thumbnailUrl} alt="thumbnail" />
                  ) : (
                    <div className="draft-card__no-image">No Image</div>
                  )}
                  <span
                    className="draft-card__status-badge"
                    style={{ color: statusColors[post.status] || '#666' }}
                  >
                    {post.status}
                  </span>
                </div>

                <div className="draft-card__body">
                  <p className="draft-card__caption">
                    {post.caption
                      ? post.caption.substring(0, 90) + '...'
                      : 'No caption yet'}
                  </p>

                  {post.scheduledAt && (
                    <p className="draft-card__scheduled">
                      📅 {new Date(post.scheduledAt).toLocaleString('vi-VN')}
                    </p>
                  )}

                  <div className="draft-card__actions">
                    <span className="draft-card__content-type">
                      {post.contentType || '—'}
                    </span>
                    {post.status === 'Draft' && (
                      <button
                        className="draft-card__delete"
                        onClick={(e) => handleDelete(e, post.id)}
                        disabled={deletingId === post.id}
                      >
                        {deletingId === post.id ? '...' : 'Delete'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h2>New Post</h2>
              <button className="modal__close" onClick={handleCloseModal}>✕</button>
            </div>

            <div className="modal__body">
              {/* File input */}
              <label className="upload-dropzone">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />
                {uploadPreviews.length === 0 ? (
                  <div className="upload-dropzone__placeholder">
                    <span>📁</span>
                    <p>Click to select images</p>
                    <small>Max 20 images</small>
                  </div>
                ) : (
                  <div className="upload-dropzone__previews">
                    {uploadPreviews.map((src, i) => (
                      <img key={i} src={src} alt={`preview-${i}`} />
                    ))}
                  </div>
                )}
              </label>

              {uploadError && (
                <p className="modal__error">{uploadError}</p>
              )}
            </div>

            <div className="modal__footer">
              <button className="btn btn--secondary" onClick={handleCloseModal}>
                Cancel
              </button>
              <button
                className="btn btn--gold"
                onClick={handleUpload}
                disabled={uploading || uploadFiles.length === 0}
              >
                {uploading ? 'Uploading...' : `Upload ${uploadFiles.length > 0 ? `(${uploadFiles.length})` : ''}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DraftListPage;