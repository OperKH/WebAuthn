import db from '../db';

export default async (ctx, teken) => {
  const { id, iat } = teken;
  const user = await db.User.findOne({ where: { id } });

  const tokenIssuedAt = iat * 1000;
  const passwordUpdatedAt = Date.parse(user.passwordUpdatedAt);
  if (tokenIssuedAt < passwordUpdatedAt) {
    return true;
  }
  return false;
};
