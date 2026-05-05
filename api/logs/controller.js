import Logs from "./model.js";

export const getLogs = async (request, reply) => {
  try {
    const { page = 1, limit = 20, level, search } = request.query;
    
    const query = {};
    if (level) query.level = level;
    if (search) {
      query.$or = [
        { message: { $regex: search, $options: 'i' } },
        { source: { $regex: search, $options: 'i' } }
      ];
    }

    const logs = await Logs.find(query)
      .limit(limit)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 })
      .populate("metadata.user")
      .lean();
    
    const total = await Logs.countDocuments(query);

    return {
      data: logs,
      meta: {
        total,
        page: parseInt(page),
        lastPage: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    return reply.status(500).send({ message: error.message });
  }
};