import dynamic from "next/dynamic";

const WebChartComponent = dynamic(
  () =>
    import("../components/WebChartComponent")
      .then((module) => module.default)
      .catch((error: unknown) => {
        console.error("Failed to load WebChartComponent", error);

        return function WebChartLoadError() {
          return (
            <main
              style={{
                minHeight: "100vh",
                display: "grid",
                placeItems: "center",
                color: "#ffb4b4",
                fontFamily: "Mulish, sans-serif",
                textAlign: "center",
                padding: "24px",
              }}
            >
              Failed to load chart workspace. Check browser console for details.
            </main>
          );
        };
      }),
  {
    ssr: false,
    loading: () => (
      <main
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          color: "#ecf5ff",
          fontFamily: "Mulish, sans-serif",
        }}
      >
        Loading chart workspace...
      </main>
    ),
  }
) as any;

export default function Web() {
  return <WebChartComponent />;
}
