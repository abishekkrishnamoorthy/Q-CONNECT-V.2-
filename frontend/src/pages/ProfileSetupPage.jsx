import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { profileApi } from "../api/profile";
import Button from "../components/shared/Button";
import { useAuthStore } from "../store/authStore";

const USERNAME_REGEX = /^[a-z0-9_]{3,20}$/;
const DOMAINS = ["Maths", "Physics", "Programming"];
const BANNER_OPTIONS = [
  "bg-gradient-to-r from-red-400 to-orange-400",
  "bg-gradient-to-r from-blue-400 to-indigo-400",
  "bg-gradient-to-r from-green-400 to-teal-400",
  "bg-gradient-to-r from-purple-400 to-pink-400",
  "bg-gradient-to-r from-yellow-400 to-orange-400"
];

/**
 * Multi-step profile setup page with slideshow design.
 * @returns {JSX.Element}
 */
export default function ProfileSetupPage() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);

  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name: user?.name || "",
    username: user?.profile?.username || user?.username || "",
    bio: user?.profile?.bio || "",
    tagline: user?.profile?.tagline || "",
    dob: user?.profile?.dob ? new Date(user.profile.dob).toISOString().split('T')[0] : "",
    banner: user?.profile?.banner || BANNER_OPTIONS[0],
    interests: user?.profile?.interests || []
  });

  const [profilePic, setProfilePic] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(user?.profile?.profileImage || "");

  const [usernameState, setUsernameState] = useState({ loading: false, available: false, message: "" });

  // For Step 3
  const [selectedDomains, setSelectedDomains] = useState([]);
  const [suggestedTopics, setSuggestedTopics] = useState([]);
  const [topicsLoading, setTopicsLoading] = useState(false);

  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const normalizedUsername = useMemo(() => form.username.trim().toLowerCase(), [form.username]);

  useEffect(() => {
    if (user?.isProfileComplete) {
      navigate("/home", { replace: true });
    }
  }, [navigate, user?.isProfileComplete]);

  // Username Availability Check
  useEffect(() => {
    if (!normalizedUsername || !USERNAME_REGEX.test(normalizedUsername)) {
      setUsernameState({ loading: false, available: false, message: "Use 3-20 lowercase letters, numbers or _" });
      return;
    }

    let isActive = true;
    const timeoutId = setTimeout(async () => {
      try {
        setUsernameState((prev) => ({ ...prev, loading: true }));
        const result = await profileApi.checkUsername(normalizedUsername);
        if (!isActive) return;

        const isCurrentUser = (user?.profile?.username || user?.username || "").toLowerCase() === normalizedUsername;
        setUsernameState({
          loading: false,
          available: result.available || isCurrentUser,
          message: isCurrentUser ? "This is your current username" : (result.available ? "Available" : "Already taken")
        });
      } catch {
        if (!isActive) return;
        setUsernameState({ loading: false, available: false, message: "Unable to check username right now" });
      }
    }, 400);

    return () => {
      isActive = false;
      clearTimeout(timeoutId);
    };
  }, [normalizedUsername, user?.profile?.username, user?.username]);

  // Fetch topics when domains change
  useEffect(() => {
    if (selectedDomains.length === 0) {
      setSuggestedTopics([]);
      return;
    }
    const fetchTopics = async () => {
      setTopicsLoading(true);
      try {
        const result = await profileApi.suggestTopics(selectedDomains);
        setSuggestedTopics(result.topics);
      } catch (err) {
        console.error("Failed to load topics", err);
      } finally {
        setTopicsLoading(false);
      }
    };
    fetchTopics();
  }, [selectedDomains]);

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      setError("Profile image must be JPG, PNG, or WebP.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Profile image must be at most 5MB.");
      return;
    }

    setError("");
    setProfilePic(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleDomainToggle = (domain) => {
    setSelectedDomains((prev) =>
      prev.includes(domain) ? prev.filter((d) => d !== domain) : [...prev, domain]
    );
  };

  const handleTopicToggle = (topic) => {
    setForm((prev) => {
      const hasTopic = prev.interests.includes(topic);
      if (!hasTopic && prev.interests.length >= 10) return prev; // Max 10 limit
      return {
        ...prev,
        interests: hasTopic
          ? prev.interests.filter((item) => item !== topic)
          : [...prev.interests, topic]
      };
    });
  };

  const isStep1Valid = usernameState.available && form.name.trim() !== "";
  const isStep3Valid = form.interests.length >= 3 && form.interests.length <= 10;

  const handleNext = () => {
    if (step === 1 && !isStep1Valid) return;
    if (step < 3) setStep((s) => s + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep((s) => s - 1);
  };

  const handleSubmit = async () => {
    if (!isStep1Valid || !isStep3Valid) return;

    setError("");
    setIsSubmitting(true);

    try {
      const result = await profileApi.setupProfile({
        ...form,
        username: normalizedUsername,
        profileImage: profilePic || previewUrl // Pass file object or existing URL
      });
      setUser(result.user);
      navigate("/home", { replace: true });
    } catch (err) {
      setError(err?.response?.data?.error?.message || "Could not save profile.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto mt-10 max-w-2xl">
      {/* Progress Indicator */}
      <div className="mb-8 flex items-center justify-between px-10">
        {[1, 2, 3].map((num) => (
          <div key={num} className="flex flex-col items-center">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold transition-colors duration-300 ${
                step >= num ? "bg-primary text-white shadow-md" : "bg-sidebar text-textSecondary"
              }`}
            >
              {num}
            </div>
            <span className="mt-2 text-xs font-medium text-textSecondary">
              {num === 1 ? "Identity" : num === 2 ? "Personal Info" : "Interests"}
            </span>
          </div>
        ))}
        {/* Progress Line */}
        <div className="absolute left-0 top-5 -z-10 h-1 w-full bg-sidebar px-10">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${((step - 1) / 2) * 100}%`, marginLeft: "40px", maxWidth: "calc(100% - 80px)" }}
          />
        </div>
      </div>

      {/* Step Content */}
      <div className="rounded-xl border border-border bg-card p-8 shadow-sm">
        {step === 1 && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-textPrimary">Create your identity</h2>
              <p className="mt-2 text-textSecondary">Set up your profile picture and username</p>
            </div>

            {/* Profile Image */}
            <div className="flex flex-col items-center space-y-4">
              <div className="relative">
                <div className="h-24 w-24 overflow-hidden rounded-full bg-sidebar">
                  {previewUrl ? (
                    <img src={previewUrl} alt="Profile" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-2xl text-textSecondary">
                      👤
                    </div>
                  )}
                </div>
                <label className="absolute -bottom-2 -right-2 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-primary text-white shadow-md hover:bg-primary-dark">
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <span className="text-sm">+</span>
                </label>
              </div>
              <p className="text-xs text-textSecondary">Click + to upload profile picture</p>
            </div>

            {/* Name */}
            <div>
              <label className="mb-2 block text-sm font-medium text-textPrimary">Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                className="w-full rounded-lg border border-border bg-background px-4 py-3 text-textPrimary placeholder-textSecondary focus:border-primary focus:outline-none"
                placeholder="Enter your name"
                required
              />
            </div>

            {/* Username */}
            <div>
              <label className="mb-2 block text-sm font-medium text-textPrimary">Username</label>
              <input
                type="text"
                value={form.username}
                onChange={(e) => setForm((prev) => ({ ...prev, username: e.target.value }))}
                className="w-full rounded-lg border border-border bg-background px-4 py-3 text-textPrimary placeholder-textSecondary focus:border-primary focus:outline-none"
                placeholder="Choose a username"
                required
              />
              <p className={`mt-2 text-sm ${usernameState.available ? "text-green-600" : "text-red-600"}`}>
                {usernameState.loading ? "Checking..." : usernameState.message}
              </p>
            </div>

            <Button
              onClick={handleNext}
              disabled={!isStep1Valid}
              className="w-full"
            >
              Next
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-textPrimary">Personal information</h2>
              <p className="mt-2 text-textSecondary">Tell us a bit about yourself</p>
            </div>

            {/* Banner Selection */}
            <div>
              <label className="mb-3 block text-sm font-medium text-textPrimary">Choose a banner</label>
              <div className="grid grid-cols-5 gap-3">
                {BANNER_OPTIONS.map((banner, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, banner }))}
                    className={`h-12 w-full rounded-lg border-2 transition-all ${
                      form.banner === banner
                        ? "border-primary shadow-md"
                        : "border-border hover:border-primary/50"
                    } ${banner}`}
                  />
                ))}
              </div>
            </div>

            {/* Tagline */}
            <div>
              <label className="mb-2 block text-sm font-medium text-textPrimary">Tagline</label>
              <input
                type="text"
                value={form.tagline}
                onChange={(e) => setForm((prev) => ({ ...prev, tagline: e.target.value }))}
                className="w-full rounded-lg border border-border bg-background px-4 py-3 text-textPrimary placeholder-textSecondary focus:border-primary focus:outline-none"
                placeholder="A short tagline about yourself"
                maxLength={100}
              />
            </div>

            {/* Bio */}
            <div>
              <label className="mb-2 block text-sm font-medium text-textPrimary">Bio</label>
              <textarea
                value={form.bio}
                onChange={(e) => setForm((prev) => ({ ...prev, bio: e.target.value }))}
                className="w-full rounded-lg border border-border bg-background px-4 py-3 text-textPrimary placeholder-textSecondary focus:border-primary focus:outline-none"
                rows={4}
                placeholder="Tell us about yourself..."
                maxLength={280}
              />
              <p className="mt-1 text-xs text-textSecondary">{form.bio.length}/280</p>
            </div>

            {/* Date of Birth */}
            <div>
              <label className="mb-2 block text-sm font-medium text-textPrimary">Date of Birth (Optional)</label>
              <input
                type="date"
                value={form.dob}
                onChange={(e) => setForm((prev) => ({ ...prev, dob: e.target.value }))}
                className="w-full rounded-lg border border-border bg-background px-4 py-3 text-textPrimary focus:border-primary focus:outline-none"
              />
            </div>

            <div className="flex gap-3">
              <Button onClick={handleBack} variant="secondary" className="flex-1">
                Back
              </Button>
              <Button onClick={handleNext} className="flex-1">
                Next
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-textPrimary">Your interests</h2>
              <p className="mt-2 text-textSecondary">Select topics you're interested in learning</p>
            </div>

            {/* Domain Selection */}
            <div>
              <label className="mb-3 block text-sm font-medium text-textPrimary">Choose your main domains</label>
              <div className="flex flex-wrap gap-3">
                {DOMAINS.map((domain) => (
                  <button
                    key={domain}
                    type="button"
                    onClick={() => handleDomainToggle(domain)}
                    className={`rounded-full border px-4 py-2 text-sm font-medium transition-all ${
                      selectedDomains.includes(domain)
                        ? "border-primary bg-primary text-white"
                        : "border-border bg-background text-textPrimary hover:border-primary/50"
                    }`}
                  >
                    {domain}
                  </button>
                ))}
              </div>
            </div>

            {/* Suggested Topics */}
            {suggestedTopics.length > 0 && (
              <div>
                <label className="mb-3 block text-sm font-medium text-textPrimary">Suggested topics</label>
                {topicsLoading ? (
                  <p className="text-sm text-textSecondary">Loading topics...</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {suggestedTopics.map((topic) => {
                      const isSelected = form.interests.includes(topic);
                      return (
                        <button
                          key={topic}
                          type="button"
                          onClick={() => handleTopicToggle(topic)}
                          disabled={!isSelected && form.interests.length >= 10}
                          className={`rounded-full border px-3 py-1 text-sm transition-all ${
                            isSelected
                              ? "border-primary bg-primary text-white"
                              : "border-border bg-background text-textPrimary hover:border-primary/50"
                          } ${!isSelected && form.interests.length >= 10 ? "opacity-50 cursor-not-allowed" : ""}`}
                        >
                          {topic}
                        </button>
                      );
                    })}
                  </div>
                )}
                <p className="mt-2 text-sm text-textSecondary">
                  {form.interests.length} / 10 selected (minimum 3)
                </p>
              </div>
            )}

            {error && <p className="text-sm text-red-600">{error}</p>}

            <div className="flex gap-3">
              <Button onClick={handleBack} variant="secondary" className="flex-1">
                Back
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || !isStep3Valid}
                className="flex-1"
              >
                {isSubmitting ? "Completing setup..." : "Complete Setup"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
