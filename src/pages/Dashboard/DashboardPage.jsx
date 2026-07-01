import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPublishedPostsApi } from '../../api/postApi';
import Navbar from '../../components/Navbar/Navbar';
import './DashboardPage.scss';

const PLATFORMS = {
  Facebook: {
    color: '#1877f2',
    buildLink: (id) => `https://www.facebook.com/${id}`,
  },
  Instagram: {
    color: '#e1306c',
    buildLink: (id) => `https://www.instagram.com/p/${id}`,
  },
};

const buildCalendarDays = (year, month) => {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++) days.push(d);
  return days;
};

const DashboardPage = () => {
  const navigate = useNavigate();
  const [publishedPosts, setPublishedPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  const today = new Date();
  const [calendarMonth, setCalendarMonth] = useState(today.getMonth());
  const [calendarYear, setCalendarYear] = useState(today.getFullYear());

  useEffect(() => {
    const fetchPublished = async () => {
      try {
        const res = await getPublishedPostsApi();
        setPublishedPosts(res.data.data || []);
      } catch (err) {
        console.error('Failed to fetch published posts:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPublished();
  }, []);

  const calendarDays = buildCalendarDays(calendarYear, calendarMonth);

  const postsByDay = {};
  publishedPosts.forEach((post) => {
    if (!post.publishedAt) return;
    const d = new Date(post.publishedAt).getDate();
    const m = new Date(post.publishedAt).getMonth();
    const y = new Date(post.publishedAt).getFullYear();
    if (m === calendarMonth && y === calendarYear) {
      if (!postsByDay[d]) postsByDay[d] = [];
      postsByDay[d].push(post);
    }
  });

  const prevMonth = () => {
    if (calendarMonth === 0) {
      setCalendarMonth(11);
      setCalendarYear((y) => y - 1);
    } else {
      setCalendarMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (calendarMonth === 11) {
      setCalendarMonth(0);
      setCalendarYear((y) => y + 1);
    } else {
      setCalendarMonth((m) => m + 1);
    }
  };

  const monthLabel = new Date(calendarYear, calendarMonth).toLocaleString('en', {
    month: 'long',
    year: 'numeric',
  });

  const renderPostLink = (pl, post) => {
    if (pl.platformPostId) {
      return (
        <a
          href={PLATFORMS[pl.platform]?.buildLink(pl.platformPostId)}
          target="_blank"
          rel="noreferrer"
          className="published-table__link"
        >
          View Post ↗
        </a>
      );
    }
    if (post.facebookPostId && pl.platform === 'Facebook') {
      return (
        <a
          href={`https://www.facebook.com/${post.facebookPostId}`}
          target="_blank"
          rel="noreferrer"
          className="published-table__link"
        >
          View Post ↗
        </a>
      );
    }
    return <span className="published-table__no-link">No link</span>;
  };

  const renderTableRows = (post) => {
    if (post.platforms && post.platforms.length > 0) {
      return post.platforms.map((pl, idx) => (
        <tr
          key={`${post.id}-${idx}`}
          onClick={() => navigate(`/drafts/${post.id}`)}
          className="published-table__row"
        >
          {idx === 0 && (
            <td rowSpan={post.platforms.length} className="published-table__thumb-cell">
              {post.thumbnailUrl ? (
                <img src={post.thumbnailUrl} alt="thumb" />
              ) : (
                <div className="published-table__no-thumb">—</div>
              )}
            </td>
          )}
          <td>
            <span
              className="platform-tag"
              style={{ color: PLATFORMS[pl.platform]?.color || '#aaa' }}
            >
              {pl.platform}
            </span>
          </td>
          <td className="published-table__date">
            {pl.publishedAt
              ? new Date(pl.publishedAt).toLocaleString('vi-VN')
              : post.publishedAt
              ? new Date(post.publishedAt).toLocaleString('vi-VN')
              : '—'}
          </td>
          <td onClick={(e) => e.stopPropagation()}>
            {renderPostLink(pl, post)}
          </td>
        </tr>
      ));
    }

    return (
      <tr
        key={post.id}
        onClick={() => navigate(`/drafts/${post.id}`)}
        className="published-table__row"
      >
        <td className="published-table__thumb-cell">
          {post.thumbnailUrl ? (
            <img src={post.thumbnailUrl} alt="thumb" />
          ) : (
            <div className="published-table__no-thumb">—</div>
          )}
        </td>
        <td>
          <span className="platform-tag" style={{ color: '#1877f2' }}>
            Facebook
          </span>
        </td>
        <td className="published-table__date">
          {post.publishedAt
            ? new Date(post.publishedAt).toLocaleString('vi-VN')
            : '—'}
        </td>
        <td onClick={(e) => e.stopPropagation()}>
          {post.facebookPostId ? (
            <a
              href={`https://www.facebook.com/${post.facebookPostId}`}
              target="_blank"
              rel="noreferrer"
              className="published-table__link"
            >
              View Post ↗
            </a>
          ) : (
            <span className="published-table__no-link">No link</span>
          )}
        </td>
      </tr>
    );
  };

  return (
    <div className="dashboard-page">
      <Navbar />
      <div className="dashboard-content">

        {/* Stats */}
        <div className="dashboard-stats">
          <div className="stat-card">
            <div className="stat-card__value">{publishedPosts.length}</div>
            <div className="stat-card__label">Published</div>
          </div>
          <div className="stat-card">
            <div className="stat-card__value">
              {publishedPosts.filter((p) =>
                p.platforms?.some((pl) => pl.platform === 'Facebook')
              ).length}
            </div>
            <div className="stat-card__label">Facebook Posts</div>
          </div>
          <div className="stat-card">
            <div className="stat-card__value">
              {publishedPosts.filter((p) =>
                p.platforms?.some((pl) => pl.platform === 'Instagram')
              ).length}
            </div>
            <div className="stat-card__label">Instagram Posts</div>
          </div>
          <div
            className="stat-card stat-card--action"
            onClick={() => navigate('/drafts')}
          >
            <div className="stat-card__value">+</div>
            <div className="stat-card__label">New Post</div>
          </div>
        </div>

        {/* Published Table */}
        <div className="dashboard-section">
          <h2>Published Posts</h2>
          {loading ? (
            <div className="dashboard-empty">Loading...</div>
          ) : publishedPosts.length === 0 ? (
            <div className="dashboard-empty">No published posts yet.</div>
          ) : (
            <div className="published-table-wrapper">
              <table className="published-table">
                <thead>
                  <tr>
                    <th>Thumbnail</th>
                    <th>Platform</th>
                    <th>Published At</th>
                    <th>Link</th>
                  </tr>
                </thead>
                <tbody>
                  {publishedPosts.map((post) => renderTableRows(post))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Calendar */}
        <div className="dashboard-section">
          <div className="calendar-header">
            <button className="calendar-nav" onClick={prevMonth}>‹</button>
            <h2>{monthLabel}</h2>
            <button className="calendar-nav" onClick={nextMonth}>›</button>
          </div>

          <div className="calendar">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
              <div key={d} className="calendar__weekday">{d}</div>
            ))}

            {calendarDays.map((day, i) => {
              const isToday =
                day === today.getDate() &&
                calendarMonth === today.getMonth() &&
                calendarYear === today.getFullYear();

              const dayPosts = day ? postsByDay[day] || [] : [];

              return (
                <div
                  key={i}
                  className={`calendar__day${!day ? ' calendar__day--empty' : ''}${isToday ? ' calendar__day--today' : ''}`}
                >
                  {day && (
                    <>
                      <span className="calendar__day-num">{day}</span>
                      <div className="calendar__day-posts">
                        {dayPosts.slice(0, 2).map((post) => (
                          <div
                            key={post.id}
                            className="calendar__post-dot"
                            onClick={() => navigate(`/drafts/${post.id}`)}
                            title={`Post #${post.id}`}
                          >
                            {post.thumbnailUrl ? (
                              <img src={post.thumbnailUrl} alt="" />
                            ) : (
                              <div className="calendar__post-dot--placeholder" />
                            )}
                          </div>
                        ))}
                        {dayPosts.length > 2 && (
                          <span className="calendar__more">+{dayPosts.length - 2}</span>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
};

export default DashboardPage;