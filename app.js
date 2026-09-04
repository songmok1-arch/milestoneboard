// 마일스톤보드 — Supabase 연동 공통 로직

const supabaseClient = window.supabase.createClient(
  window.SUPABASE_URL,
  window.SUPABASE_ANON_KEY
);

function genShareCode(len = 6) {
  const chars = "abcdefghijkmnpqrstuvwxyz23456789";
  let out = "";
  const arr = new Uint32Array(len);
  crypto.getRandomValues(arr);
  for (let i = 0; i < len; i++) out += chars[arr[i] % chars.length];
  return out;
}

async function createBoard(title) {
  const share_code = genShareCode();
  const { data, error } = await supabaseClient
    .from("mb_boards")
    .insert({ title, share_code })
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function loadBoardByCode(code) {
  const { data, error } = await supabaseClient
    .from("mb_boards")
    .select("*")
    .eq("share_code", code)
    .single();
  if (error) throw error;
  return data;
}

async function loadMilestones(boardId) {
  const { data, error } = await supabaseClient
    .from("mb_milestones")
    .select("*")
    .eq("board_id", boardId)
    .order("due_date", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data;
}

async function addMilestone(boardId, { title, due_date, memo }) {
  const { data, error } = await supabaseClient
    .from("mb_milestones")
    .insert({ board_id: boardId, title, due_date: due_date || null, memo: memo || null })
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function updateMilestoneStatus(id, status) {
  const { error } = await supabaseClient.from("mb_milestones").update({ status }).eq("id", id);
  if (error) throw error;
}

async function deleteMilestone(id) {
  const { error } = await supabaseClient.from("mb_milestones").delete().eq("id", id);
  if (error) throw error;
}

function statusLabel(status) {
  return { planned: "예정", doing: "진행중", done: "완료" }[status] || status;
}
function nextStatus(status) {
  return { planned: "doing", doing: "done", done: "planned" }[status] || "planned";
}

function exportMarkdown(board, milestones) {
  const lines = [`# ${board.title} — 마일스톤`, ""];
  milestones.forEach((m) => {
    const box = m.status === "done" ? "[x]" : "[ ]";
    const due = m.due_date ? ` — ${m.due_date}까지` : "";
    lines.push(`- ${box} ${m.title}${due} (${statusLabel(m.status)})`);
  });
  return lines.join("\n");
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (e) {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    try {
      document.execCommand("copy");
      document.body.removeChild(ta);
      return true;
    } catch (e2) {
      document.body.removeChild(ta);
      return false;
    }
  }
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
