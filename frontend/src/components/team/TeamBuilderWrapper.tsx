import { useState, useEffect, useCallback } from "react";
import { Plus, Trash2, Pencil, ArrowLeft, Users } from "lucide-react";
import { teamApi } from "../../services/api/team";
import { TeamBuilder } from "./TeamBuilder";
import type { Team } from "../../types/team";
import { PanelHeader } from "../common/PanelHeader";
import { nameToGradient } from "../common/cardUtils";

type View = "list" | "editor";

export function TeamBuilderWrapper() {
  const [view, setView] = useState<View>("list");
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null);

  const loadTeams = useCallback(async () => {
    try {
      setLoading(true);
      const res = await teamApi.list(0, 100);
      setTeams(res.teams);
    } catch (e) {
      console.error("Failed to load teams:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTeams();
  }, [loadTeams]);

  const handleCreateNew = () => {
    setEditingTeamId(null);
    setView("editor");
  };

  const handleEditTeam = (teamId: string) => {
    setEditingTeamId(teamId);
    setView("editor");
  };

  const handleDeleteTeam = async (teamId: string) => {
    if (!window.confirm("Are you sure you want to delete this team?")) return;
    try {
      await teamApi.delete(teamId);
      setTeams((prev) => prev.filter((t) => t.id !== teamId));
    } catch (e) {
      console.error("Failed to delete team:", e);
    }
  };

  const handleSave = (_team: Team) => {
    loadTeams();
  };

  const handleClose = () => {
    setView("list");
    setEditingTeamId(null);
    loadTeams();
  };

  if (view === "editor") {
    return (
      <div className="skill-theme-shell flex h-full min-h-0 flex-col">
        <div className="flex items-center gap-2 border-b border-[var(--theme-border)] px-3 py-2 sm:px-5">
          <button
            onClick={handleClose}
            className="btn-secondary h-8 px-2.5 text-xs"
          >
            <ArrowLeft size={14} />
            Back
          </button>
        </div>
        <div className="flex-1 min-h-0">
          <TeamBuilder
            teamId={editingTeamId}
            onSave={handleSave}
            onClose={handleClose}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="skill-theme-shell flex h-full min-h-0 flex-col">
      <PanelHeader
        className="skill-panel-header"
        title="Teams"
        subtitle="Compose role-based agent teams"
        icon={
          <Users size={18} className="text-stone-500 dark:text-stone-400" />
        }
        actions={
          <button onClick={handleCreateNew} className="btn-primary h-9 text-sm">
            <Plus size={15} />
            New team
          </button>
        }
      />

      <div className="skill-content-area flex-1 overflow-y-auto px-4 py-4 sm:p-6">
        {loading ? (
          <div className="skill-empty-state">
            <Users size={28} className="skill-empty-state__icon" />
            <p className="skill-empty-state__title">Loading teams...</p>
          </div>
        ) : teams.length === 0 ? (
          <div className="skill-empty-state">
            <div className="skill-empty-state__icon">
              <Users size={28} />
            </div>
            <p className="skill-empty-state__title">No teams yet</p>
            <p className="skill-empty-state__description">
              Create a team by combining roles from your library.
            </p>
            <button
              onClick={handleCreateNew}
              className="btn-primary mt-4 h-9 text-sm"
            >
              <Plus size={15} />
              Create your first team
            </button>
          </div>
        ) : (
          <div className="grid auto-grid-cols gap-3">
            {teams.map((team) => {
              const colors = nameToGradient(team.name);
              const activeCount = team.members.filter((m) => m.enabled).length;
              return (
                <div
                  key={team.id}
                  className="team-card"
                  style={{ "--team-accent": colors[0] } as React.CSSProperties}
                >
                  {/* Color dot + name row */}
                  <div className="flex items-center gap-2">
                    <div
                      className="team-card__color-dot"
                      style={{ background: colors[0] }}
                    />
                    <h3 className="team-card__name">{team.name}</h3>
                    <div className="team-card__actions">
                      <button
                        onClick={() => handleEditTeam(team.id)}
                        className="scb__action-btn scb__action-btn--ghost"
                        title="Edit"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => handleDeleteTeam(team.id)}
                        className="scb__action-btn scb__action-btn--ghost"
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="team-card__desc">
                    {team.description || "A coordinated team of role agents."}
                  </p>

                  {/* Avatars */}
                  {team.members.length > 0 && (
                    <div className="team-card__avatars">
                      {team.members.slice(0, 4).map((member) => (
                        <div
                          key={member.member_id}
                          className="team-card__avatar-item"
                          title={member.role_name}
                        >
                          <Users
                            size={12}
                            className="text-[var(--theme-text-secondary)]"
                          />
                        </div>
                      ))}
                      {team.members.length > 4 && (
                        <div className="team-card__avatar-overflow">
                          +{team.members.length - 4}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Meta */}
                  <p className="team-card__meta">
                    {team.members.length} member
                    {team.members.length !== 1 ? "s" : ""}
                    {" · "}
                    {activeCount} active
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
