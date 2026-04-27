// report service

const { v4: uuidv4 } = require('uuid');
const { store, save } = require('../models/db');
const { cleanString, stripUnsafe } = require('../utils/validators');

const VALID_TYPES = ['product', 'user'];

function createReport(reporterId, reporterName, data) {
  if (!data.targetId || !data.reason) {
    return { success: false, message: 'Target and reason are required' };
  }
  const reason = stripUnsafe(cleanString(data.reason, 300));
  if (!reason || reason.length < 5) {
    return { success: false, message: 'Reason must be 5-300 characters' };
  }

  const targetType = VALID_TYPES.includes(data.targetType) ? data.targetType : 'product';

  if (targetType === 'product') {
    if (!store.products.find(p => p.id === data.targetId)) {
      return { success: false, message: 'Reported product not found' };
    }
  } else {
    if (!store.users.find(u => u.id === data.targetId)) {
      return { success: false, message: 'Reported user not found' };
    }
  }

  // prevent duplicate reports
  const existing = store.reports.find(
    r => r.reporterId === reporterId && r.targetId === data.targetId && r.status === 'pending'
  );
  if (existing) return { success: false, message: 'You already reported this item' };

  // anti-spam: max 5 open reports per reporter at once
  const openByMe = store.reports.filter(r => r.reporterId === reporterId && r.status === 'pending').length;
  if (openByMe >= 5) {
    return { success: false, message: 'You already have several open reports awaiting review' };
  }

  // snapshot target name so admin sees what was reported even if the item is later edited
  let targetName = '';
  if (targetType === 'product') {
    const p = store.products.find(x => x.id === data.targetId);
    targetName = p ? p.title : '';
  } else {
    const u = store.users.find(x => x.id === data.targetId);
    targetName = u ? u.username : '';
  }

  const report = {
    id: uuidv4(),
    reporterId,
    reporterName,
    targetId: data.targetId,
    targetType,
    targetName,
    reason,
    status: 'pending',
    createdAt: new Date().toISOString(),
    resolvedAt: null
  };

  store.reports.push(report);
  save();

  return { success: true, message: 'Report submitted, admin will review it', data: report };
}

function getReports(statusFilter) {
  let result = [...store.reports];
  if (statusFilter && statusFilter !== 'all') {
    result = result.filter(r => r.status === statusFilter);
  }
  result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  return { success: true, data: result };
}

function handleReport(reportId, action) {
  const report = store.reports.find(r => r.id === reportId);
  if (!report) return { success: false, message: 'Report not found' };

  if (action === 'resolve') {
    report.status = 'resolved';
    report.resolvedAt = new Date().toISOString();
    if (report.targetType === 'product') {
      const p = store.products.find(x => x.id === report.targetId);
      if (p) p.status = 'removed';
    }
  } else if (action === 'dismiss') {
    report.status = 'dismissed';
    report.resolvedAt = new Date().toISOString();
  } else {
    return { success: false, message: "Action must be 'resolve' or 'dismiss'" };
  }

  save();
  return { success: true, message: `Report ${action}d`, data: report };
}

module.exports = { createReport, getReports, handleReport };
