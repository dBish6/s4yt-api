import { Request, Response, NextFunction } from "express";
import * as gameService from "../services/gameService";
import {
  AddChestCoinsRequestDto,
  RSVPMeetUpRequestDto,
  SaveAnswerRequestDto,
  UpdateStakedCoinsDto,
} from "../dtos/GameDto";
import { CustomJwtPayload } from "../../typings/express/Request";
import { HttpError } from "../../middleware/errorHandler";

export const getRaffleItemsTransformed = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = (req.decodedClaims as CustomJwtPayload)?.userId;
    const raffleItems = await gameService.getRaffleItemsTransformed(userId);
    res.json(raffleItems);
  } catch (error: any) {
    next(error);
  }
};

export const updateStakedCoins = async (req: UpdateStakedCoinsDto, res: Response, next: NextFunction) => {
  try {
    const { staked_items, total_coins } = req.body;
    const userId = (req.decodedClaims as CustomJwtPayload)?.userId;
    const result = await gameService.updateStakedCoins(staked_items, userId, total_coins);
    res.json(result);
  } catch (error: any) {
    next(error);
  }
}

// Controller to send raffle winners
export const sendRaffleWinners = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const winners = await gameService.getRaffleWinners();
    res.json(winners);
  } catch (error: any) {
    next(error);
  }
};

// Controller to add "Learn and Earn" chest coins to a user's total
export const addChestCoins = async (
  req: AddChestCoinsRequestDto,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = (req.decodedClaims as CustomJwtPayload)?.userId;
    if (!userId) {
      throw new HttpError("User is not authenticated", 401);
    }

    const { amount, chest_id } = req.body;
    const user = await gameService.assignCoinsToUser(
      userId,
      parseInt(amount),
      "chest",
      { chest_id }
    );

    res.status(200).json({ chests_submitted: user.chests_submitted });
  } catch (error: any) {
    next(error);
  }
};

export const getChests = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const chests = await gameService.getChests();
    res.status(200).json(chests);
  } catch (error: any) {
    next(error);
  }
};

export const saveAnswer = async (req: SaveAnswerRequestDto, res: Response) => {
  try {
    const userId = (req.decodedClaims as CustomJwtPayload)?.userId;
    if (!userId) {
      throw new HttpError('User is not authenticated', 401);
    }
    // const { challenge_id, submission_link } = req.body;

    // Shouldn't save for the demo.
    // await gameService.saveAnswer(challenge_id, userId, submission_link);
    res.status(200).json({ message: 'Answer submitted to challenge' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const rsvpMeetUp = async (req: RSVPMeetUpRequestDto, res: Response, next: NextFunction) => {
  try {
    const userId = (req.decodedClaims as CustomJwtPayload)?.userId;
    if (!userId) {
      throw new HttpError('User is not authenticated', 401);
    }
    const { attend_meeting } = req.body;

    const updatedUser = await gameService.rsvpMeetUp(userId, attend_meeting);
    return res
      .status(200)
      .json({
        message: "RSVP status updated",
        attend_meeting: updatedUser.attend_meeting
      });
  } catch (error: any) {
    next(error);
  }
};

export const displayEventResults = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const eventResults = await gameService.getEventResults();
    res.status(200).json(eventResults);
  } catch (error: any) {
    next(error);
  }
};

export const sendCoinsGainedHistory = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = (req.decodedClaims as CustomJwtPayload)?.userId;
    if (!userId) {
      throw new HttpError("User is not authenticated", 401);
    }

    const coinHistory = await gameService.getCoinsGainedHistory(userId);
    return res.status(200).json({ coin_details: coinHistory });
  } catch (error: any) {
    next(error);
  }
};

export const sendCoinsTotal = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = (req.decodedClaims as CustomJwtPayload)?.userId;
    if (!userId) {
      throw new HttpError("User is not authenticated", 401);
    }

    const coinTotal = await gameService.getCoinsTotal(userId);
    return res.status(200).json(coinTotal);
  } catch (error: any) {
    next(error);
  }
};
