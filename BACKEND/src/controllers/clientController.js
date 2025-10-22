import Client from '../models/Client.js';
import logger from '../lib/logger.js';

export async function createClient(req, res, next) {
  try {
    const { name, email, address, city, country, postalCode, contact } = req.validated;

    // Check if client already exists
    const existingClient = await Client.findOne({ orgId: req.user.orgId, email: email.toLowerCase() });
    if (existingClient) {
      return res.status(409).json({ error: 'Client with this email already exists' });
    }

    const client = new Client({
      orgId: req.user.orgId,
      name,
      email: email.toLowerCase(),
      address,
      city,
      country,
      postalCode,
      contact,
    });

    await client.save();
    logger.info(`Client created: ${client._id}`);

    res.status(201).json({
      message: 'Client created successfully',
      client,
    });
  } catch (error) {
    next(error);
  }
}

export async function listClients(req, res, next) {
  try {
    const { page = 1, limit = 10, search } = req.query;
    const skip = (page - 1) * limit;

    const query = { orgId: req.user.orgId, isActive: true };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const [clients, total] = await Promise.all([
      Client.find(query).skip(skip).limit(parseInt(limit)).sort({ createdAt: -1 }),
      Client.countDocuments(query),
    ]);

    res.status(200).json({
      message: 'Clients retrieved successfully',
      clients,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getClient(req, res, next) {
  try {
    const client = await Client.findOne({ _id: req.params.id, orgId: req.user.orgId });

    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }

    res.status(200).json({
      message: 'Client retrieved successfully',
      client,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateClient(req, res, next) {
  try {
    const client = await Client.findOne({ _id: req.params.id, orgId: req.user.orgId });

    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }

    // Update fields
    Object.assign(client, req.validated);
    await client.save();

    logger.info(`Client updated: ${client._id}`);

    res.status(200).json({
      message: 'Client updated successfully',
      client,
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteClient(req, res, next) {
  try {
    const client = await Client.findOne({ _id: req.params.id, orgId: req.user.orgId });

    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }

    // Soft delete
    client.isActive = false;
    await client.save();

    logger.info(`Client deleted: ${client._id}`);

    res.status(200).json({ message: 'Client deleted successfully' });
  } catch (error) {
    next(error);
  }
}
