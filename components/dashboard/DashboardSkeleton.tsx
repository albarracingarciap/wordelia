import { Skeleton } from "../ui/Skeleton";
import { Card } from "../ui/Card";

export function DashboardSkeleton() {
    return (
        <div>
            {/* Header Skeleton */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
                <div>
                    <Skeleton className="h-3 w-24 mb-3" /> {/* Eyebrow */}
                    <Skeleton className="h-8 w-64 mb-3" /> {/* Title */}
                    <Skeleton className="h-5 w-96" /> {/* Subtitle */}
                </div>
                <div className="flex gap-3">
                    <Skeleton className="h-9 w-28 rounded-xl" /> {/* Action 1 */}
                    <Skeleton className="h-9 w-36 rounded-xl" /> {/* Action 2 */}
                </div>
            </div>

            {/* Stats Row Skeleton */}
            <div className="flex gap-3 mb-8">
                <Skeleton className="h-7 w-32 rounded-full" />
                <Skeleton className="h-7 w-40 rounded-full" />
                <Skeleton className="h-7 w-32 rounded-full" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Column */}
                <div className="lg:col-span-8 space-y-10">

                    {/* Now Reading Skeleton */}
                    <section>
                        <Skeleton className="h-6 w-32 mb-4" /> {/* Title */}
                        {/* 2 Loading Book Cards */}
                        <div className="space-y-4">
                            {[1, 2].map((i) => (
                                <div key={i} className="bg-white rounded-xl border border-teal/5 p-4 md:p-6 flex flex-col md:flex-row gap-6">
                                    <Skeleton className="w-28 h-40 rounded-md shrink-0" /> {/* Cover */}
                                    <div className="flex-1 flex flex-col">
                                        <Skeleton className="h-6 w-3/4 mb-2" />
                                        <Skeleton className="h-4 w-1/3 mb-auto" />
                                        <div className="mt-4">
                                            <Skeleton className="h-1.5 w-full rounded-full mb-3" />
                                            <div className="flex gap-3">
                                                <Skeleton className="h-9 w-24 rounded-xl" />
                                                <Skeleton className="h-9 w-24 rounded-xl" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Milestones Skeleton */}
                    <section>
                        <Skeleton className="h-6 w-32 mb-4" />
                        <Card className="bg-cream/20 border-teal/5">
                            <div className="space-y-4">
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-3/4" />
                                <Skeleton className="h-4 w-5/6" />
                            </div>
                        </Card>
                    </section>
                </div>

                {/* Right Column */}
                <div className="lg:col-span-4 space-y-8">
                    {/* Actions */}
                    <section>
                        <Skeleton className="h-4 w-20 mb-4" />
                        <div className="grid grid-cols-2 gap-3">
                            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-10 w-full rounded-lg" />)}
                        </div>
                    </section>

                    {/* Recommended */}
                    <section>
                        <div className="flex justify-between mb-4">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-5 w-24 rounded-full" />
                        </div>
                        <div className="bg-white rounded-xl border border-teal/5 p-4 flex gap-4">
                            <Skeleton className="w-20 h-28 rounded-md" />
                            <div className="flex-1 space-y-2">
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-3 w-2/3" />
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}
