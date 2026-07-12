with open(r"C:\Users\Lenovo\sm\frontend\src\pages\TrialInvitations.js", "r", encoding="utf-8") as f:
    content = f.read()

# Add delete handler
content = content.replace(
    "  const loadInvitations = async",
    """  const handleDelete = async (inviteId) => {
    try {
      await api.deleteTrialInvitation(inviteId);
      setInvitations(prev => prev.filter(i => i.id !== inviteId));
      toast.success("Invitation deleted");
    } catch (e) {
      toast.error("Failed to delete");
    }
  };

  const loadInvitations = async"""
)

# Add delete button after decline button
content = content.replace(
    '''                    <XCircle className="w-4 h-4 mr-2" /> Decline
                  </Button>
                </div>
              )}
            </div>''',
    '''                    <XCircle className="w-4 h-4 mr-2" /> Decline
                  </Button>
                </div>
              )}
              <div className="mt-3 flex justify-end">
                <button onClick={() => handleDelete(invite.id)}
                  className="text-xs text-muted-foreground hover:text-red-400 transition-colors flex items-center gap-1">
                  <Trash2 className="w-3 h-3" /> Delete invitation
                </button>
              </div>
            </div>'''
)

with open(r"C:\Users\Lenovo\sm\frontend\src\pages\TrialInvitations.js", "w", encoding="utf-8") as f:
    f.write(content)
print("Done!")
print("Trash2 imported:", "Trash2" in content)