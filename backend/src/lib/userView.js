// Shape the user record for API responses. Keeps responses consistent
// and avoids leaking fields we do not intend to expose.
export function toUserView(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    collegeName: user.collegeName,
    githubUrl: user.githubUrl,
    resumeUrl: user.resumeUrl,
    portfolioUrl: user.portfolioUrl,
    profileCompleted: user.profileCompleted,
  }
}
