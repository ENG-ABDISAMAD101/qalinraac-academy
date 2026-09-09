"use client";

import { Camera, Pencil, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { FinanceShell } from "@/components/finance/FinanceShell";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import {
  financeUpdateProfileRequest,
  getApiErrorMessage,
  mediaPublicUrl,
  uploadFileRequest,
} from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { cn, initialsFromName } from "@/lib/utils";

function splitName(fullName?: string) {
  const parts = (fullName ?? "").trim().split(/\s+/).filter(Boolean);
  return {
    firstName: parts[0] ?? "",
    lastName: parts.slice(1).join(" "),
  };
}

export default function FinanceProfilePage() {
  const { user, refresh } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const initial = useMemo(() => {
    const { firstName, lastName } = splitName(user?.fullName);
    return {
      firstName,
      lastName,
      phone: user?.phone ?? "",
      bio: user?.bio ?? "",
      avatarUrl: user?.avatarUrl ?? "",
      previewUrl: mediaPublicUrl(user?.avatarUrl) ?? "",
    };
  }, [user]);

  const [form, setForm] = useState(initial);

  useEffect(() => {
    if (!editing) setForm(initial);
  }, [initial, editing]);

  function setField<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function onPickPhoto(file?: File | null) {
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const localPreview = URL.createObjectURL(file);
      setField("previewUrl", localPreview);
      const uploaded = await uploadFileRequest(file);
      if (!uploaded.url) {
        throw new Error("Upload returned no URL");
      }
      setField("avatarUrl", uploaded.url);
      setField("previewUrl", mediaPublicUrl(uploaded.url) || localPreview);
    } catch {
      setError("Could not upload photo. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  async function onSave() {
    if (!form.firstName.trim()) {
      setError("First name is required.");
      return;
    }
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const fullName = [form.firstName.trim(), form.lastName.trim()]
        .filter(Boolean)
        .join(" ");
      await financeUpdateProfileRequest({
        fullName,
        phone: form.phone.trim() || undefined,
        bio: form.bio,
        avatarUrl: form.avatarUrl || undefined,
      });
      await refresh();
      setEditing(false);
      setMessage("Profile updated successfully.");
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not save profile. Please try again."));
    } finally {
      setSaving(false);
    }
  }

  function onCancel() {
    setEditing(false);
    setForm(initial);
    setError("");
  }

  const displayName = user?.fullName ?? "Finance";
  const roleLabel = "Finance";
  const avatarSrc = editing
    ? form.previewUrl || mediaPublicUrl(user?.avatarUrl)
    : mediaPublicUrl(user?.avatarUrl);

  return (
    <FinanceShell>
      <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold text-primary dark:text-foreground">
              Profile Settings
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage your finance portal profile
            </p>
          </div>
          {!editing ? (
            <Button type="button" onClick={() => setEditing(true)}>
              <Pencil className="h-4 w-4" />
              Edit Profile
            </Button>
          ) : (
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" onClick={onCancel}>
                <X className="h-4 w-4" />
                Cancel
              </Button>
              <Button type="button" disabled={saving} onClick={() => void onSave()}>
                {saving ? (
                  <Spinner className="sm on-primary" label="Saving" />
                ) : null}
                Save changes
              </Button>
            </div>
          )}
        </div>

        {message ? (
          <p className="rounded-2xl border border-primary/40 bg-primary-soft/50 px-4 py-3 text-sm font-medium text-primary">
            {message}
          </p>
        ) : null}
        {error ? (
          <p className="rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {error}
          </p>
        ) : null}

        <div
          className={cn(
            "grid gap-6",
            editing
              ? "xl:grid-cols-[300px_minmax(0,1fr)]"
              : "lg:grid-cols-[280px_minmax(0,1fr)]",
          )}
        >
          <aside className="card-soft flex flex-col items-center px-6 py-8 text-center">
            <div className="relative">
              <Avatar className="h-28 w-28 border-4 border-white shadow-md ring-1 ring-border">
                <AvatarImage src={avatarSrc} alt={displayName} />
                <AvatarFallback className="text-2xl font-bold text-primary">
                  {initialsFromName(displayName)}
                </AvatarFallback>
              </Avatar>
              {editing ? (
                <>
                  <button
                    type="button"
                    disabled={uploading}
                    onClick={() => fileRef.current?.click()}
                    className="absolute -bottom-1 -right-1 flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition hover:bg-primary/90"
                    aria-label="Change photo"
                  >
                    {uploading ? (
                      <Spinner className="sm on-primary !text-[0.85rem]" label="Uploading" />
                    ) : (
                      <Camera className="h-4 w-4" />
                    )}
                  </button>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={(e) => void onPickPhoto(e.target.files?.[0])}
                  />
                </>
              ) : null}
            </div>

            {editing ? (
              <button
                type="button"
                disabled={uploading}
                onClick={() => fileRef.current?.click()}
                className="mt-4 text-xs font-semibold text-primary underline-offset-4 hover:underline dark:text-primary"
              >
                Change Photo
              </button>
            ) : null}

            <h2 className="mt-5 font-display text-xl font-bold text-primary dark:text-foreground">
              {editing
                ? [form.firstName, form.lastName].filter(Boolean).join(" ") ||
                  displayName
                : displayName}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">{user?.email}</p>
            <Badge variant="default" className="mt-3 normal-case">
              {roleLabel}
            </Badge>

            <div className="mt-6 w-full space-y-3 rounded-2xl bg-canvas px-4 py-4 text-left text-sm dark:bg-muted/40">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Email
                </p>
                <p className="mt-0.5 font-semibold text-foreground">
                  {user?.email}
                </p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Role
                </p>
                <p className="mt-0.5 font-semibold text-foreground">{roleLabel}</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Registration date
                </p>
                <p className="mt-0.5 font-semibold text-foreground">
                  {user?.createdAt
                    ? new Date(user.createdAt).toLocaleDateString(undefined, {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })
                    : "—"}
                </p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Account status
                </p>
                <p className="mt-0.5 font-semibold text-primary">
                  {user?.isActive === false ? "Inactive" : "Active"}
                </p>
              </div>
            </div>
          </aside>

          <section className="card-soft p-6 sm:p-8">
            {!editing ? (
              <div className="space-y-8">
                <div>
                  <h3 className="text-base font-bold text-primary dark:text-foreground">
                    Personal information
                  </h3>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <div className="rounded-2xl border border-border/70 px-4 py-3">
                      <p className="text-xs text-muted-foreground">First Name</p>
                      <p className="mt-1 font-semibold">
                        {splitName(user?.fullName).firstName || "—"}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-border/70 px-4 py-3">
                      <p className="text-xs text-muted-foreground">Last Name</p>
                      <p className="mt-1 font-semibold">
                        {splitName(user?.fullName).lastName || "—"}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-border/70 px-4 py-3">
                      <p className="text-xs text-muted-foreground">Role</p>
                      <p className="mt-1 font-semibold">{roleLabel}</p>
                    </div>
                    <div className="rounded-2xl border border-border/70 px-4 py-3">
                      <p className="text-xs text-muted-foreground">
                        Phone Number
                      </p>
                      <p className="mt-1 font-semibold">
                        {user?.phone || "—"}
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-base font-bold text-primary dark:text-foreground">
                    Bio
                  </h3>
                  <p className="mt-3 rounded-2xl border border-border/70 px-4 py-4 text-sm leading-relaxed text-muted-foreground">
                    {user?.bio?.trim() || "Tell us about yourself"}
                  </p>
                </div>

                <p className="text-xs text-muted-foreground">
                  Password changes use Forgot Password on the sign-in page.
                </p>
              </div>
            ) : (
              <div className="space-y-8">
                <div>
                  <h3 className="text-base font-bold text-primary dark:text-foreground">
                    Edit profile
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Update your details and save when you&apos;re ready.
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={form.firstName}
                      onChange={(e) => setField("firstName", e.target.value)}
                      placeholder="Abdirizak"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={form.lastName}
                      onChange={(e) => setField("lastName", e.target.value)}
                      placeholder="Mohamed"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Input id="role" value={roleLabel} disabled readOnly />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      value={form.phone}
                      onChange={(e) => setField("phone", e.target.value)}
                      placeholder="+252 61 000 0000"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    value={form.bio}
                    onChange={(e) => setField("bio", e.target.value)}
                    placeholder="Tell us about yourself"
                    rows={4}
                  />
                </div>

                <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-6">
                  <Button type="button" variant="outline" onClick={onCancel}>
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    disabled={saving || uploading}
                    onClick={() => void onSave()}
                  >
                    {saving ? (
                      <Spinner className="sm on-primary" label="Saving" />
                    ) : null}
                    Save changes
                  </Button>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </FinanceShell>
  );
}
