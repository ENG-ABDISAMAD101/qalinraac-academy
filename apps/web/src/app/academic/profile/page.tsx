"use client";

import Image from "next/image";
import { FormEvent, useEffect, useRef, useState } from "react";
import { AcademicShell } from "@/components/academic/AcademicShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  academicUpdateProfileRequest,
  getApiErrorMessage,
  mediaPublicUrl,
  uploadFileRequest,
} from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

export default function AcademicProfilePage() {
  const { user, refresh } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);

  const [fullName, setFullName] = useState(user?.fullName ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [bio, setBio] = useState(user?.bio ?? "");
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl ?? "");
  const [previewUrl, setPreviewUrl] = useState(
    mediaPublicUrl(user?.avatarUrl) ?? "",
  );
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saved, setSaved] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setFullName(user?.fullName ?? "");
    setPhone(user?.phone ?? "");
    setBio(user?.bio ?? "");
    setAvatarUrl(user?.avatarUrl ?? "");
    setPreviewUrl(mediaPublicUrl(user?.avatarUrl) ?? "");
  }, [user]);

  async function onPickPhoto(file?: File | null) {
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const localPreview = URL.createObjectURL(file);
      setPreviewUrl(localPreview);
      const uploaded = await uploadFileRequest(file);
      if (!uploaded.url) throw new Error("Upload returned no URL");
      setAvatarUrl(uploaded.url);
      setPreviewUrl(mediaPublicUrl(uploaded.url) || localPreview);
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not upload photo."));
    } finally {
      setUploading(false);
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaved("");
    setError("");
    setSaving(true);
    try {
      await academicUpdateProfileRequest({
        fullName: fullName.trim() || undefined,
        phone: phone.trim() || undefined,
        bio,
        avatarUrl: avatarUrl || undefined,
      });
      await refresh();
      setSaved("Profile saved.");
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not save profile."));
    } finally {
      setSaving(false);
    }
  }

  const registered = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString(undefined, {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "—";

  return (
    <AcademicShell>
      <div className="mx-auto max-w-3xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-brand-navy dark:text-foreground">
            Profile
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Password changes use Forgot Password on login
          </p>
        </div>
        <form onSubmit={onSubmit} className="card-soft space-y-5 p-6">
          <div className="flex items-center gap-4">
            {previewUrl ? (
              <Image
                src={previewUrl}
                alt=""
                width={72}
                height={72}
                className="rounded-full bg-muted object-cover"
                unoptimized
              />
            ) : (
              <div className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-muted text-lg font-bold text-brand-navy">
                {(fullName || user?.email || "A").slice(0, 1).toUpperCase()}
              </div>
            )}
            <label className="cursor-pointer rounded-full border border-border px-4 py-2 text-xs font-semibold">
              {uploading ? "Uploading…" : "Update profile picture"}
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                disabled={uploading}
                onChange={(e) => void onPickPhoto(e.target.files?.[0])}
              />
            </label>
          </div>
          <label className="block text-sm font-medium">
            Full name
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="mt-2 w-full rounded-2xl border border-border px-4 py-3"
            />
          </label>
          <label className="block text-sm font-medium">
            Phone
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="mt-2 w-full rounded-2xl border border-border px-4 py-3"
            />
          </label>
          <label className="block text-sm font-medium">
            Bio
            <textarea
              rows={4}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="mt-2 w-full rounded-2xl border border-border px-4 py-3"
            />
          </label>
          <div className="grid gap-3 rounded-2xl bg-muted p-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-xs text-muted-foreground">Email</p>
              <p className="font-semibold">{user?.email ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Role</p>
              <Badge variant="default" className="mt-1 normal-case">
                {user?.role ?? "Academic"}
              </Badge>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Registered</p>
              <p className="font-semibold">{registered}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Status</p>
              <Badge
                variant={user?.isActive === false ? "muted" : "lime"}
                className="mt-1 normal-case"
              >
                {user?.isActive === false ? "Inactive" : "Active"}
              </Badge>
            </div>
          </div>
          <Button type="submit" disabled={saving || uploading}>
            {saving ? (
              <Spinner className="sm on-primary" label="Saving" />
            ) : null}
            Save changes
          </Button>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          {saved ? (
            <p className="text-sm text-brand-navy dark:text-brand-lime">
              {saved}
            </p>
          ) : null}
        </form>
      </div>
    </AcademicShell>
  );
}
