// import { useViewerRecord } from "@self.id/framework";

// export function ShowViewerName() {
//   const record = useViewerRecord("basicProfile");

//   const text = record.isLoading
//     ? "Loading..."
//     : record.content
//     ? `Hello ${record.content.name || "stranger"}`
//     : "No profile to load";
//   return <p>{text}</p>;
// }

// export function SetViewerName() {
//   const record = useViewerRecord("basicProfile");

//   return (
//     <button
//       disabled={!record.isMutable || record.isMutating}
//       onClick={async () => {
//         await record.merge({ name: "Alice" });
//       }}
//     >
//       Set name
//     </button>
//   );
// }
