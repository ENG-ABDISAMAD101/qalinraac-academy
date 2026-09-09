"use client";

import Image from "next/image";
import { FormEvent, useState } from "react";
import { ResearchShell } from "@/components/research/ResearchShell";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { demoResearchUser } from "@/lib/research-demo-data";

export default function ResearchProfilePage() {
  const { user } = useAuth();
  const [fullName, setFullName] = useState(
    user?.fullName ?? demoResearchUser.fullName,
  );
  const [phone, setPhone] = useState(demoResearchUser.phone);
  const [bio, setBio] = useState(demoResearchUser.bio);
  const [saved, setSaved] = useState(false);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaved(true);
  }

  return (
    <ResearchShell>
      <div className="mx-auto max-w-3xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-brand-navy dark:text-foreground">
            Profile
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Password changes use Forgot Password / Reset Password
          </p>
        </div>
        <form onSubmit={onSubmit} className="card-soft space-y-5 p-6">
          <div className="flex items-center gap-4">
            <Image
              src={user?.avatarUrl || demoResearchUser.avatarUrl}
              alt=""
              width={72}
              height={72}
              className="rounded-full bg-muted"
              unoptimized
            />
            <label className="cursor-pointer rounded-full border border-border px-4 py-2 text-xs font-semibold">
              Update profile picture
              <input type="file" accept="image/*" className="hidden" />
            </label>
          </div>
          <label className="block text-sm font-medium">
            Full name
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3"
            />
          </label>
          <label className="block text-sm font-medium">
            Phone
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3"
            />
          </label>
          <label className="block text-sm font-medium">
            Bio
            <textarea
              rows={4}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3"
            />
          </label>
          <div className="grid gap-3 rounded-2xl bg-muted p-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-xs text-muted-foreground">Email</p>
              <p className="font-semibold">
                {user?.email ?? demoResearchUser.email}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Role</p>
              <p className="font-semibold">Research</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Registered</p>
              <p className="font-semibold">15 Mar 2025</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Account status</p>
              <p className="font-semibold">{demoResearchUser.accountStatus}</p>
            </div>
          </div>
          <Button type="submit">Save changes</Button>
          {saved ? (
            <p className="text-sm text-brand-navy dark:text-brand-lime">
              Profile saved (demo).
            </p>
          ) : null}
        </form>
      </div>
    </ResearchShell>
  );
}
