"use client";

import { AlertCircle, CheckCircle, Loader2, Mail, MessageSquare, Phone, User, X } from "lucide-react";
import { useEffect, useState } from "react";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

export default function BookDemoModal({ isOpen, onClose }: Props) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [isOpen]);

  const handleClose = () => {
    if (loading) return;
    setFormData({ name: "", email: "", phone: "", message: "" });
    setError(null);
    setSuccess(false);
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim() || !formData.phone.trim()) {
      setError("Please fill in all required fields");
      return;
    }
    setLoading(true);
    setError(null);
    window.setTimeout(() => {
      setLoading(false);
      setSuccess(true);
      window.setTimeout(() => {
        setSuccess(false);
        handleClose();
      }, 2200);
    }, 500);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 p-4 backdrop-blur-md sm:p-6"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div className="flex max-h-[min(90vh,calc(100dvh-2rem))] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-gray-200/50 bg-white shadow-2xl">
        <div className="shrink-0 bg-gradient-to-r from-orange-500 via-orange-600 to-red-600 p-1">
          <div className="rounded-t-2xl bg-white px-6 py-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-red-600 shadow-lg shadow-orange-500/30">
                  <Mail className="text-white" size={20} />
                </div>
                <div>
                  <h2 className="bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-2xl font-bold text-transparent">
                    Book a Demo
                  </h2>
                  <p className="mt-0.5 text-sm text-gray-600">Schedule a personalized demo with our team</p>
                </div>
              </div>
              <button type="button" onClick={handleClose} className="rounded-lg p-2 hover:bg-gray-100" aria-label="Close">
                <X className="text-gray-500" size={22} />
              </button>
            </div>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto bg-gradient-to-b from-white to-gray-50 p-6">
          {success ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-red-600">
                <CheckCircle className="text-white" size={40} />
              </div>
              <h3 className="mb-2 text-center text-2xl font-bold text-gray-900">Request submitted</h3>
              <p className="max-w-sm text-center text-sm text-gray-600">
                Demo request captured for this preview. Our team would follow up by email.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {error ? (
                <div className="flex items-start gap-3 rounded-lg border-l-4 border-red-500 bg-red-50 p-4">
                  <AlertCircle className="mt-0.5 shrink-0 text-red-500" size={20} />
                  <p className="text-sm font-medium text-red-700">{error}</p>
                </div>
              ) : null}
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <label className="space-y-2">
                  <span className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <User className="text-orange-600" size={14} /> Full Name *
                  </span>
                  <input
                    name="name"
                    value={formData.name}
                    onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                    className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-sm text-gray-900"
                    placeholder="Enter your full name"
                  />
                </label>
                <label className="space-y-2">
                  <span className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <Mail className="text-red-600" size={14} /> Email *
                  </span>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))}
                    className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-sm text-gray-900"
                    placeholder="your.email@example.com"
                  />
                </label>
                <label className="space-y-2 md:col-span-2">
                  <span className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <Phone className="text-orange-600" size={14} /> Phone *
                  </span>
                  <input
                    name="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData((p) => ({ ...p, phone: e.target.value }))}
                    className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-sm text-gray-900"
                    placeholder="+91 98765 43210"
                  />
                </label>
              </div>
              <label className="space-y-2">
                <span className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <MessageSquare className="text-red-600" size={14} /> Message
                </span>
                <textarea
                  name="message"
                  rows={4}
                  value={formData.message}
                  onChange={(e) => setFormData((p) => ({ ...p, message: e.target.value }))}
                  className="w-full resize-none rounded-xl border-2 border-gray-200 px-4 py-3 text-sm text-gray-900"
                  placeholder="Tell us about your farm or questions…"
                />
              </label>
              <div className="flex justify-end gap-3 border-t border-gray-200 pt-6">
                <button type="button" onClick={handleClose} className="rounded-xl bg-gray-100 px-6 py-3 text-sm font-semibold">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-red-600 px-8 py-3 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {loading ? <Loader2 className="animate-spin" size={18} /> : null}
                  {loading ? "Submitting..." : "Submit Request"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
