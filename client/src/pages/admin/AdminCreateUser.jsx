import { useState } from "react";
import { ArrowLeft, UserPlus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import adminUserService from "../../services/adminUserService";
import CustomSelect from "../../components/CustomSelect";

const AdminCreateUser = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    username: "",
    password: "",
    role: "client",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setLoading(true);
      setError("");
      setSuccess("");

      await adminUserService.createUser(formData);

      setSuccess("User created successfully.");

      setTimeout(() => {
        navigate("/admin/users");
      }, 700);
    } catch (error) {
      console.error("Create user error:", error);

      setError(error.response?.data?.message || "Unable to create user.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-[1000px] space-y-8">
      {/* Header */}
      <div>
        <button
          type="button"
          onClick={() => navigate("/admin/users")}
          className="mb-5 inline-flex items-center gap-2 text-sm text-white/40 transition hover:text-white"
        >
          <ArrowLeft size={16} />
          Back to Users
        </button>

        <p className="text-xs font-medium uppercase tracking-[0.2em] text-white/30">
          Administration
        </p>

        <h1 className="mt-1 text-3xl font-medium tracking-tight sm:text-4xl">
          Add User
        </h1>

        <p className="mt-2 text-sm text-white/40">
          Create a new client or administrator account.
        </p>
      </div>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 sm:p-7"
      >
        <div className="grid gap-5 sm:grid-cols-2">
          {/* Name */}
          <div>
            <label className="mb-2 block text-sm text-white/60">Name</label>

            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="Full name"
              className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none placeholder:text-white/25 focus:border-white/30"
            />
          </div>

          {/* Email */}
          <div>
            <label className="mb-2 block text-sm text-white/60">Email</label>

            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="user@example.com"
              className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none placeholder:text-white/25 focus:border-white/30"
            />
          </div>

          {/* Username */}
          <div>
            <label className="mb-2 block text-sm text-white/60">Username</label>

            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
              placeholder="username"
              className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none placeholder:text-white/25 focus:border-white/30"
            />
          </div>

          {/* Password */}
          <div>
            <label className="mb-2 block text-sm text-white/60">Password</label>

            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              minLength={6}
              placeholder="Minimum 6 characters"
              className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none placeholder:text-white/25 focus:border-white/30"
            />
          </div>

          {/* Role */}
          <div className="sm:col-span-2">
            <label className="mb-2 block text-sm text-white/60">Role</label>

            <CustomSelect
              value={formData.role}
              onChange={(value) =>
                handleChange({
                  target: {
                    name: "role",
                    value,
                  },
                })
              }
              options={[
                {
                  value: "client",
                  label: "Client",
                },
                {
                  value: "admin",
                  label: "Admin",
                },
              ]}
            />

            <p className="mt-2 text-xs text-white/30">
              Client is recommended unless administrator access is required.
            </p>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="mt-5 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        {success && (
          <div className="mt-5 rounded-xl border border-green-500/20 bg-green-500/10 px-4 py-3 text-sm text-green-300">
            {success}
          </div>
        )}

        {/* Submit */}
        <div className="mt-7 flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-medium text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <UserPlus size={17} />

            {loading ? "Creating..." : "Create User"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminCreateUser;
