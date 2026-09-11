import { describe, it, expect } from "vitest";

/**
 * Format provider rating display helper (mirroring RequestStatusCard / WorkerProfileModal logic)
 */
export function formatProviderRatingDisplay(provider: {
  avg_rating?: number | null;
  rating?: number | null;
  total_reviews?: number | null;
  reviewCount?: number | null;
}): { badge: string; showStar: boolean; label: string } {
  const rating = provider.avg_rating ?? provider.rating ?? null;
  const reviews = provider.total_reviews ?? provider.reviewCount ?? 0;

  if (rating !== null && reviews > 0) {
    return {
      badge: "rated",
      showStar: true,
      label: `★ ${rating.toFixed(1)}`,
    };
  }

  return {
    badge: "nuevo",
    showStar: false,
    label: "Nuevo",
  };
}

export function formatJobsCompletedDisplay(totalJobsCompleted?: number | null): string | null {
  if (!totalJobsCompleted || totalJobsCompleted <= 0) {
    return null; // Omit line, never show "120 trabajos"
  }
  return `${totalJobsCompleted} trabajos completados`;
}

describe("D-05: Rating honesty in frontend (never invent ratings or jobs)", () => {
  it("renders 'Nuevo' without a star when a provider has no reviews", () => {
    const unratedProvider = {
      avg_rating: null,
      total_reviews: 0,
    };

    const display = formatProviderRatingDisplay(unratedProvider);

    expect(display.label).toBe("Nuevo");
    expect(display.showStar).toBe(false);
    expect(display.badge).toBe("nuevo");
    expect(display.label).not.toContain("4.9");
    expect(display.label).not.toContain("5.0");
    expect(display.label).not.toContain("★");
  });

  it("handles legacy zero rating with zero reviews as 'Nuevo'", () => {
    const zeroRatingProvider = {
      avg_rating: 0,
      total_reviews: 0,
    };

    const display = formatProviderRatingDisplay(zeroRatingProvider);

    expect(display.label).toBe("Nuevo");
    expect(display.showStar).toBe(false);
  });

  it("does not fabricate '120 trabajos' when actual completed jobs count is zero", () => {
    expect(formatJobsCompletedDisplay(0)).toBeNull();
    expect(formatJobsCompletedDisplay(null)).toBeNull();
    expect(formatJobsCompletedDisplay(undefined)).toBeNull();
    expect(formatJobsCompletedDisplay(5)).toBe("5 trabajos completados");
  });

  it("renders stars and rating only when reviews > 0 and rating is present", () => {
    const ratedProvider = {
      avg_rating: 4.9,
      total_reviews: 12,
    };

    const display = formatProviderRatingDisplay(ratedProvider);

    expect(display.label).toBe("★ 4.9");
    expect(display.showStar).toBe(true);
    expect(display.badge).toBe("rated");
  });
});
