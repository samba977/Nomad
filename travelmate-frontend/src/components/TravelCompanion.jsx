import React, { useEffect, useMemo, useState } from "react";
import "./TravelCompanion.css";
import { useNavigate } from "react-router-dom";
import profile1 from "../assets/P1.png";
import Mainlayout from "../layouts/Mainlayout";
import { useAuth } from "../context/AuthContext";

const API_BASE =
  (typeof import.meta !== "undefined" &&
    import.meta.env &&
    import.meta.env.VITE_API_BASE_URL) ||
  "http://localhost:5000";

/** Normalize interests to an array */
function normalizeInterests(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean);
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
  } catch {
    return [];
  }
}

/** Build absolute image URL or fall back */
function buildImageUrl(profileImageUrl) {
  if (!profileImageUrl) return profile1;
  if (/^(https?:)?\/\//i.test(profileImageUrl) || /^data:/i.test(profileImageUrl)) {
    return profileImageUrl;
  }
  const path = profileImageUrl.startsWith("/") ? profileImageUrl : `/${profileImageUrl}`;
  return `${API_BASE}${path}`;
}

/** Compact, expandable interest chip list */
const InterestTags = ({ tags = [], max = 2 }) => {
  const [expanded, setExpanded] = useState(false);
  if (!Array.isArray(tags) || tags.length === 0) return null;

  const visible = expanded ? tags : tags.slice(0, max);
  const hiddenCount = Math.max(tags.length - max, 0);

  return (
    <div className="interest-tags">
      {visible.map((tag, i) => (
        <span className="interest-tag" key={`${tag}-${i}`}>
          {tag}
        </span>
      ))}

      {hiddenCount > 0 && (
        <button
          type="button"
          className="interest-toggle"
          onClick={() => setExpanded((e) => !e)}
          aria-label={
            expanded
              ? "Show fewer interests"
              : `Show ${hiddenCount} more interests`
          }
        >
          {expanded ? "Show less" : `+${hiddenCount} more`}
        </button>
      )}
    </div>
  );
};

const TravelCompanion = () => {
  const [companions, setCompanions] = useState([]);
  const [plansByUser, setPlansByUser] = useState({});
  const [loading, setLoading] = useState(true);
  const [plansLoading, setPlansLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { user } = useAuth();

  const userInterests = useMemo(() => normalizeInterests(user?.interests), [user?.interests]);
  const currentUserId = user?._id || user?.id || null;
  const authToken = user?.token;

  useEffect(() => {
    const abort = new AbortController();
    const fetchCompanionsWithPlans = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`${API_BASE}/api/users/public-profiles`, {
          signal: abort.signal,
        });
        if (!res.ok) throw new Error(`Failed to load users (${res.status})`);
        const data = await res.json();

        const formattedUsers = (Array.isArray(data) ? data : [])
          .filter((u) => u && (u._id || u.id))
          .map((u) => {
            const id = u._id || u.id;
            return {
              id,
              name: u.fullName || u.username || "User",
              img: buildImageUrl(u.profileImageUrl),
              bio: u.bio || "Ready for a new adventure!",
              interests: normalizeInterests(u.interests),
            };
          })
          .sort((a, b) => a.name.localeCompare(b.name));

        setCompanions(formattedUsers);

        setPlansLoading(true);
        const results = await Promise.allSettled(
          formattedUsers.map(async (fu) => {
            const resPlans = await fetch(`${API_BASE}/api/travel-plans/user/${fu.id}`, {
              signal: abort.signal,
              headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
            });
            if (!resPlans.ok) return { id: fu.id, plans: [] };
            const json = await resPlans.json();
            return { id: fu.id, plans: Array.isArray(json) ? json : [] };
          })
        );

        const aggregate = {};
        results.forEach((r) => {
          if (r.status === "fulfilled") aggregate[r.value.id] = r.value.plans;
        });
        setPlansByUser(aggregate);
      } catch (e) {
        if (e.name !== "AbortError") setError(e.message || "Failed to load companions.");
      } finally {
        setLoading(false);
        setPlansLoading(false);
      }
    };

    fetchCompanionsWithPlans();
    return () => abort.abort();
  }, [authToken]);

  const { similarInterestUsers, otherUsers } = useMemo(() => {
    const sim = [];
    const oth = [];
    companions.forEach((c) => {
      if (currentUserId && c.id === currentUserId) return;
      const hasShared =
        userInterests.length > 0 && c.interests?.some((i) => userInterests.includes(i));
      (hasShared ? sim : oth).push(c);
    });
    return { similarInterestUsers: sim, otherUsers: oth };
  }, [companions, userInterests, currentUserId]);

  return (
    <Mainlayout>
      <section className="companion-section">
        {loading ? (
          <p style={{ color: "white", textAlign: "center", width: "100%" }}>Loading companions…</p>
        ) : error ? (
          <p style={{ color: "salmon", textAlign: "center", width: "100%" }}>{error}</p>
        ) : (
          <>
            {similarInterestUsers.length > 0 && (
              <>
                <div className="companion-section-title">Users who have the same interest as you</div>
                <div className="cards-wrapper">
                  {similarInterestUsers.map((c) => (
                    <div className="companion-card-new" key={c.id}>
                      <div className="profile-pic-circle">
                        <img className="profile-pic-img" src={c.img} alt={c.name} />
                      </div>
                      <div className="companion-card-body">
                        <h3 className="companion-name">{c.name}</h3>

                        {/* ✅ Collapsible interests */}
                        <InterestTags tags={c.interests} max={2} />

                        <div className="companion-bio">{c.bio}</div>
                        <button className="view-profile-btn" onClick={() => navigate(`/public-profile/${c.id}`)}>
                          View Profile
                        </button>

                        <div className="view-profile-btn plan-box" aria-busy={plansLoading}>
                          <div className="plan-title">Plan</div>
                          {plansByUser[c.id]?.length > 0 ? (
                            plansByUser[c.id].map((plan, i) => (
                              <div key={`${c.id}-plan-${i}`} className="plan-content">
                                {plan.title} — {plan.destination}
                              </div>
                            ))
                          ) : (
                            <div className="plan-content">
                              {plansLoading ? "Loading…" : "No travel plans found"}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {otherUsers.length > 0 && (
              <>
                <div className="companion-section-title other-title">Other users</div>
                <div className="cards-wrapper">
                  {otherUsers.map((c) => (
                    <div className="companion-card-new" key={c.id}>
                      <div className="profile-pic-circle">
                        <img className="profile-pic-img" src={c.img} alt={c.name} />
                      </div>
                      <div className="companion-card-body">
                        <h3 className="companion-name">{c.name}</h3>

                        {/* ✅ Collapsible interests */}
                        <InterestTags tags={c.interests} max={2} />

                        <div className="companion-bio">{c.bio}</div>
                        <button className="view-profile-btn" onClick={() => navigate(`/public-profile/${c.id}`)}>
                          View Profile
                        </button>

                        <div className="view-profile-btn plan-box" aria-busy={plansLoading}>
                          <div className="plan-title">Plan</div>
                          {plansByUser[c.id]?.length > 0 ? (
                            plansByUser[c.id].map((plan, i) => (
                              <div key={`${c.id}-plan-${i}`} className="plan-content">
                                {plan.title} — {plan.destination}
                              </div>
                            ))
                          ) : (
                            <div className="plan-content">
                              {plansLoading ? "Loading…" : "No travel plans found"}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {similarInterestUsers.length === 0 && otherUsers.length === 0 && (
              <p style={{ color: "white", textAlign: "center", width: "100%" }}>No companions found.</p>
            )}
          </>
        )}
      </section>
    </Mainlayout>
  );
};

export default TravelCompanion;
