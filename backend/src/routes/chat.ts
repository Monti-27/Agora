import { Router } from 'express';
import { chatController } from '../controllers/chatController';
import { authenticateToken } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { ChatType, MessageType } from '../types';

const router = Router();

// All chat routes require authentication
router.use(authenticateToken);

// Chat routes
router.get('/', chatController.getChats);

router.post('/',
  validateRequest([
    {
      field: 'chatType',
      required: true,
      type: 'string',
    },
    {
      field: 'memberIds',
      required: true,
      type: 'array',
    },
    {
      field: 'name',
      required: false,
      type: 'string',
      minLength: 1,
      maxLength: 100,
    },
    {
      field: 'description',
      required: false,
      type: 'string',
      maxLength: 500,
    },
  ]),
  chatController.createChat
);

router.get('/:chatId', chatController.getChat);

// Message routes
router.get('/:chatId/messages',
  validateRequest([
    {
      field: 'limit',
      required: false,
      type: 'number',
    },
    {
      field: 'offset',
      required: false,
      type: 'number',
    },
  ]),
  chatController.getMessages
);

router.post('/:chatId/messages',
  validateRequest([
    {
      field: 'content',
      required: true,
      type: 'string',
      minLength: 1,
      maxLength: 10000,
    },
    {
      field: 'messageType',
      required: false,
      type: 'string',
    },
    {
      field: 'replyToId',
      required: false,
      type: 'string',
    },
  ]),
  chatController.sendMessage
);

// Mark message as read
router.post('/messages/:messageId/read', chatController.markMessageRead);

export default router;
