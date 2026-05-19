export const mockVenues = [
  {
    id: "venue_demo_1",
    name: "Bar do Eurípedes",
    city: "Uberaba",
    state: "MG",
    logo_url: "",
    banner_url: "",
    active: true,
  },
  {
    id: "venue_demo_2",
    name: "Snooker Arena",
    city: "Ribeirão Preto",
    state: "SP",
    logo_url: "",
    banner_url: "",
    active: true,
  },
]

export const mockTables = [
  { id: "t1", venue_id: "venue_demo_1", name: "Mesa 1", table_code: "1" },
  { id: "t2", venue_id: "venue_demo_1", name: "Mesa 2", table_code: "2" },
  { id: "t3", venue_id: "venue_demo_2", name: "Mesa 1", table_code: "1" },
]

export const mockVideos = [
  {
    id: "v1",
    venue_id: "venue_demo_1",
    table_id: "t1",
    title: "Mesa 1 • 19:10",
    video_url: "",
    thumbnail_url: "",
    drive_file_id: "",
    recorded_at: new Date().toISOString(),
    duration: 25,
  },
]

