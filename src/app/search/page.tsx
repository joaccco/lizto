import { Suspense } from "react";

import SearchPage from "./SearchPageClient";

export default function SearchRoutePage() {
  return (
    <Suspense fallback={null}>
      <SearchPage />
    </Suspense>
  );
}
