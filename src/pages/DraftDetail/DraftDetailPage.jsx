import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getPostDetailApi } from '../../api/postApi';
import Navbar from '../../components/Navbar/Navbar';
import ImagePostEditor from './ImagePostEditor';
import VideoPostEditor from './VideoPostEditor';
import './DraftDetailPage.scss';

// Shell component — only responsible for loading post and routing to correct editor
const DraftDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ text: '', type: '' });

  const fetchPost = async () => {
    try {
      const res = await getPostDetailApi(id);
      setPost(res.data.data);
    } catch (err) {
      console.error('Failed to fetch post:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchPost();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const showMessage = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 3000);
  };

  if (loading) return (
    <div className="draft-detail-page">
      <Navbar />
      <div className="draft-detail-loading">Loading...</div>
    </div>
  );

  if (!post) return (
    <div className="draft-detail-page">
      <Navbar />
      <div className="draft-detail-loading">Post not found.</div>
    </div>
  );

  const sharedProps = { post, postId: id, navigate, message, showMessage, refetchPost: fetchPost };

  return (
    <div className="draft-detail-page">
      <Navbar />
      <div className="draft-detail-content">

        {/* Shared header across both editor types */}
        <div className="draft-detail-header">
          <button className="draft-detail-header__back" onClick={() => navigate('/drafts')}>
            ← Back
          </button>
          <div className="draft-detail-header__status">
            Status:{' '}
            <span className={`status-badge status-badge--${post.status?.toLowerCase()}`}>
              {post.status}
            </span>
          </div>
        </div>

        {/* Shared message banner */}
        {message.text && (
          <div className={`draft-detail-message draft-detail-message--${message.type}`}>
            {message.text}
          </div>
        )}

        {/* Route to correct editor based on postType */}
        {post.postType === 'Video'
          ? <VideoPostEditor {...sharedProps} />
          : <ImagePostEditor {...sharedProps} />
        }

      </div>
    </div>
  );
};

export default DraftDetailPage;