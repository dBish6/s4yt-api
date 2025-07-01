import User from '../../models/user';
import Challenge from '../../models/challenge';
import Business from '../../models/business';
import ChestModel from '../../models/chest';
import MultipleChoiceModel from '../../models/multipleChoice';
import { LoginResponse } from '../dtos/AdminDto';
import { compare } from "bcryptjs";
import jwt from 'jsonwebtoken';
import UserModel from '../../models/user';
import { resolveErrorHandler } from '../../middleware/errorHandler';
import RaffleItemModel from '../../models/raffleItem';
import { RaffleWinners } from '../../typings/RaffleItem';
import { BusinessChallengeWinners } from '../../typings/Challenge';

interface RaffleWinnerWithEmail extends RaffleWinners {
  item_name: String
}

export const loginAdmin = async (email: string, password: string): Promise<LoginResponse> => {
  const user = await User.findOne({ email });
  if (!user) {
    throw new Error("Invalid email");
  }

  const isMatch = await compare(password, user.password);
  if (!isMatch) {
    throw new Error("Invalid password");
  }

  const business = user.role === "Business"
    ? await Business.findOne({ business_user_id: user._id }).select("_id")
    : null;

  const token = jwt.sign(
    { userId: user._id, roles: user.role },
    process.env.JWT_SECRET as string,
    { expiresIn: "1h" }
  );

  return {
    token,
    userData: {
      _id: user._id.toString(),
      email: user.email,
      role: user.role,
      businessId: business?._id?.toString() || null,
    },
  };
};

export const retrieveAllUsers = async () => {
  const users = await User.find({});
  return users;
};

export const retrieveAllBusinesses = async () => {
  const businesses = await Business.find({});
  return businesses;
};

export const kickOutUser = async (userId: string) => {
  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');

  user.kicked = true;
  await user.save();
};

export const banAUser = async (userId: string, duration: number) => {
  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');

  user.banned_until = new Date(Date.now() + duration);
  await user.save();
};

export const createBusiness = async (name: string, logo: string, description: string) => {
  const business = new Business({
    name,
    logo,
    description
  });
  await business.save();
}

export const editChallenge = async (challengeId: string, challengeData: any) => {
  const challenge = await Challenge.findByIdAndUpdate(challengeId, challengeData, { new: true });
  if (!challenge) {
    throw new Error('Challenge not found');
  }
  return challenge;
};

export const createChest = async (chestGroupData: any) => {
  const chestGroup = await Promise.all(
    chestGroupData.map(async (challengeData: any) => {
      const multipleChoice = new MultipleChoiceModel(challengeData);
      await multipleChoice.save();
      return multipleChoice;
    })
  );

  const chest = new ChestModel({
    group: chestGroup
  });

  await chest.save();
  return chest;
}

export const getRSVPedUsers = async () => {
  try {
    const attendingUsers = await UserModel.find({ attend_meeting: true }, '-_id email').lean();
    const emails = attendingUsers.map(user => user.email);

    return { attending_users: emails };
  } catch (error) {
    throw resolveErrorHandler(error);
  }
}

export const getRaffleWinners = async (): Promise<RaffleWinnerWithEmail[] | null> => {
  try {
    const raffleItems = await RaffleItemModel.find({}, "image_src name winners")
      .populate("raffle_partner", "name logo")
      .lean();

    const results = await Promise.all(raffleItems.map(async (item): Promise<RaffleWinnerWithEmail | null> => {
      if (!item.winners || item.winners.length === 0) {
        return null;
      }
      const partner = item.raffle_partner as {name?: string; logo?: string}
      return {
        partner_name: partner.name,
        item_name: item.name,
        image_src: item.image_src,
        logo: partner?.logo,
        winners: await UserModel.find({ "_id": { $in: item.winners } }, 'name -_id email').lean()
      };
    }))

    return results.filter((result): result is RaffleWinnerWithEmail => result !== null);

  } catch (error) {
    throw resolveErrorHandler(error);
  }
};

export const getChallengeWinners = async (): Promise<BusinessChallengeWinners[]> => {
  try {
    const businesses = await Business.find({}, 'name logo winners')
      .lean()
      .populate({
        path: 'winners',
        populate: {
          path: 'user_id',
          model: 'User',
          select: '-_id name email',
        },
      });

    return businesses.map(business => {
      const winners = business.winners.map(winner => {
        const user = winner.user_id;
        return {
          award: winner.award,
          name: user.name,
          email: user.email
        }
      });

      return {
        business_name: business.name,
        logo: business.logo,
        winners
      };
    });
  } catch (error) {
    throw resolveErrorHandler(error);
  }
}

export const getEventResults = async () => {
  try {
    const challengeWinners = await getChallengeWinners();
    const raffleWinners = await getRaffleWinners();

    return {
      raffle_winners: raffleWinners,
      challenge_winners: challengeWinners
    }
  } catch (error) {
    throw resolveErrorHandler(error);
  }
};